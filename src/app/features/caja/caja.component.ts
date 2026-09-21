import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ciclo2Service } from '../../core/services/ciclo2.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductoService } from '../../core/services/producto.service';
import { Comprobante, ItemVenta, MetodoCaja, Reserva } from '../../core/models/ciclo2.models';
import { VarianteDTO } from '../../core/models/catalogo.models';
import { formatearErrorApi } from '../../core/utils/error-handler.util';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit {
  codigo = '';
  reserva?: Reserva;
  variantes: VarianteDTO[] = [];
  items: ItemVenta[] = [];
  variante = '';
  cantidad = 1;
  metodo: MetodoCaja = 'EFECTIVO';
  cargando = false;
  procesando = false;
  error = '';
  comprobante?: Comprobante;

  constructor(
    private api: Ciclo2Service,
    public auth: AuthService,
    private productos: ProductoService
  ) {}

  ngOnInit() {
    this.productos.gestionarVariantes().subscribe({
      next: v => this.variantes = v,
      error: e => this.error = this.msg(e)
    });
  }

  buscar() {
    if (!this.codigo.trim()) {
      this.error = 'Ingrese un código de reserva para buscar.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.api.reservaPorCodigo(this.codigo.trim()).subscribe({
      next: r => {
        this.reserva = r;
        this.items = r.detalles
          .filter(d => d.cantidad_reservada > d.cantidad_vendida)
          .map(d => ({
            detalle_reserva_id: d.id,
            variante_id: d.variante_id,
            cantidad: d.cantidad_reservada - d.cantidad_vendida
          }));
        this.cargando = false;
        if (!this.items.length) {
          this.error = 'Esta reserva no tiene prendas disponibles para cobro (ya fueron cobradas o liberadas).';
        }
      },
      error: e => {
        this.error = this.msg(e);
        this.cargando = false;
      }
    });
  }

  agregar() {
    this.error = '';
    if (!this.variante) {
      this.error = 'Seleccione una variante antes de agregar.';
      return;
    }
    if (this.cantidad < 1) {
      this.error = 'La cantidad debe ser al menos 1.';
      return;
    }
    this.items.push({ variante_id: this.variante, cantidad: this.cantidad });
    this.variante = '';
    this.cantidad = 1;
  }

  quitar(i: number) {
    this.items.splice(i, 1);
  }

  v(id: string) {
    return this.variantes.find(x => x.id === id)?.sku || (id ? 'Prenda' : '—');
  }

  vender() {
    const u = this.auth.obtenerUsuarioActual();
    this.error = '';
    if (!u?.sucursal_id) {
      this.error = 'El usuario no tiene una sucursal asignada para operar en caja.';
      return;
    }
    if (!this.items.length) {
      this.error = 'Debe agregar al menos una prenda para procesar la venta.';
      return;
    }
    if (this.procesando) return;

    this.procesando = true;
    this.api.registrarVenta({
      reserva_id: this.reserva?.id,
      sucursal_id: u.sucursal_id,
      cliente_id: this.reserva?.cliente_id,
      metodo: this.metodo,
      items: this.items
    }).subscribe({
      next: v => {
        this.api.comprobante(v.id).subscribe({
          next: c => {
            this.comprobante = c;
            this.procesando = false;
            this.items = [];
          },
          error: e => {
            this.error = this.msg(e);
            this.procesando = false;
          }
        });
      },
      error: e => {
        this.error = this.msg(e);
        this.procesando = false;
      }
    });
  }

  nueva() {
    this.reserva = undefined;
    this.comprobante = undefined;
    this.codigo = '';
    this.items = [];
    this.error = '';
  }

  imprimir() {
    window.print();
  }

  private msg(e: unknown): string {
    return formatearErrorApi(e, 'No se pudo completar la operación en caja.');
  }
}
