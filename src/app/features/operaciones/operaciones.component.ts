import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ciclo2Service } from '../../core/services/ciclo2.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ProductoService } from '../../core/services/producto.service';
import { Comprobante, DetalleVenta, ReporteVentas, VentaSucursal } from '../../core/models/ciclo2.models';
import { SucursalDTO } from '../../core/models/organizacion.models';
import { VarianteDTO } from '../../core/models/catalogo.models';
import { formatearErrorApi } from '../../core/utils/error-handler.util';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operaciones.component.html',
  styleUrls: ['./operaciones.component.css']
})
export class OperacionesComponent implements OnInit {
  tab: 'ventas' | 'devolucion' | 'merma' = 'ventas';
  sucursales: SucursalDTO[] = [];
  variantes: VarianteDTO[] = [];
  sucursal = '';
  desde = '';
  hasta = '';
  reporte?: ReporteVentas;

  // Devolución
  busquedaVenta = '';
  buscandoVenta = false;
  comprobanteDev?: Comprobante;
  detalleSeleccionado?: DetalleVenta;
  detalleVenta = '';
  cantidadDev = 1;
  maxCantidadDev = 1;
  motivo = '';

  // Merma
  variante = '';
  cantidadMerma = 1;
  causa = '';

  // Estado UI
  cargando = false;
  procesando = false;
  error = '';
  exito = '';

  constructor(
    private api: Ciclo2Service,
    public auth: AuthService,
    private org: OrganizacionService,
    private productos: ProductoService
  ) {}

  ngOnInit() {
    const u = this.auth.obtenerUsuarioActual();
    this.sucursal = u?.sucursal_id || '';
    this.org.gestionarSucursales().subscribe({
      next: s => this.sucursales = s,
      error: e => this.error = this.msg(e)
    });
    this.productos.gestionarVariantes().subscribe({
      next: v => this.variantes = v,
      error: e => this.error = this.msg(e)
    });
    if (this.sucursal) this.cargarVentas();
  }

  cargarVentas() {
    if (!this.sucursal) return;
    this.cargando = true;
    this.error = '';
    this.api.reporteVentas(this.sucursal, {
      desde: this.desde ? new Date(this.desde).toISOString() : '',
      hasta: this.hasta ? new Date(this.hasta).toISOString() : ''
    }).subscribe({
      next: r => {
        this.reporte = r;
        this.cargando = false;
      },
      error: e => {
        this.error = this.msg(e);
        this.cargando = false;
      }
    });
  }

  buscarVentaParaDevolucion(terminoManual?: string) {
    const termino = (terminoManual !== undefined ? terminoManual : this.busquedaVenta).trim();
    if (!termino) {
      this.error = 'Ingrese un número de venta (ej. VNT-0001) o identificador para buscar.';
      return;
    }
    this.buscandoVenta = true;
    this.error = '';
    this.exito = '';
    this.detalleSeleccionado = undefined;
    this.detalleVenta = '';

    this.api.comprobante(termino).subscribe({
      next: comp => {
        this.comprobanteDev = comp;
        this.busquedaVenta = comp.numero || comp.id;
        this.buscandoVenta = false;
        if (comp.detalles && comp.detalles.length === 1) {
          this.seleccionarLineaDevolucion(comp.detalles[0]);
        }
      },
      error: e => {
        this.buscandoVenta = false;
        this.comprobanteDev = undefined;
        this.error = this.msg(e);
      }
    });
  }

  seleccionarLineaDevolucion(item: DetalleVenta) {
    this.detalleSeleccionado = item;
    this.detalleVenta = item.id;
    this.maxCantidadDev = item.cantidad;
    this.cantidadDev = Math.min(1, item.cantidad);
    this.error = '';
  }

  irADevolucionDesdeVenta(v: VentaSucursal) {
    this.tab = 'devolucion';
    this.busquedaVenta = v.numero || v.id;
    this.buscarVentaParaDevolucion(this.busquedaVenta);
  }

  obtenerSkuVariante(varianteId: string): string {
    const v = this.variantes.find(item => item.id === varianteId);
    return v ? `${v.sku} (Bs ${v.precio})` : (varianteId ? 'Prenda' : '—');
  }

  devolver() {
    this.error = '';
    this.exito = '';

    if (!this.detalleVenta) {
      this.error = 'Debe seleccionar o especificar una línea de venta para la devolución.';
      return;
    }
    if (this.cantidadDev < 1) {
      this.error = 'La cantidad a devolver debe ser al menos 1.';
      return;
    }
    if (this.detalleSeleccionado && this.cantidadDev > this.detalleSeleccionado.cantidad) {
      this.error = `La cantidad no puede ser mayor a ${this.detalleSeleccionado.cantidad} unidades vendidas en esta línea.`;
      return;
    }
    if (this.procesando) return;

    this.procesando = true;
    this.api.devolver(this.detalleVenta, this.cantidadDev, this.motivo.trim() || undefined).subscribe({
      next: () => {
        this.procesando = false;
        this.exito = 'Devolución registrada exitosamente. El inventario disponible y el kardex fueron actualizados.';
        this.detalleVenta = '';
        this.detalleSeleccionado = undefined;
        this.motivo = '';
        this.cantidadDev = 1;
      },
      error: e => {
        this.procesando = false;
        this.error = this.msg(e);
      }
    });
  }

  mermar() {
    this.error = '';
    this.exito = '';

    if (!this.sucursal) {
      this.error = 'Seleccione una sucursal para registrar la merma.';
      return;
    }
    if (!this.variante) {
      this.error = 'Seleccione la variante a dar de baja por merma.';
      return;
    }
    if (this.cantidadMerma < 1) {
      this.error = 'La cantidad de merma debe ser al menos 1.';
      return;
    }
    if (!this.causa.trim()) {
      this.error = 'Indique la causa o justificación de la merma.';
      return;
    }
    if (this.procesando) return;

    this.procesando = true;
    this.api.registrarMerma(this.variante, this.sucursal, this.cantidadMerma, this.causa.trim()).subscribe({
      next: () => {
        this.procesando = false;
        this.exito = 'Merma registrada con su respectivo movimiento de inventario.';
        this.variante = '';
        this.causa = '';
        this.cantidadMerma = 1;
      },
      error: e => {
        this.procesando = false;
        this.error = this.msg(e);
      }
    });
  }

  private msg(e: unknown): string {
    return formatearErrorApi(e, 'No se pudo completar la operación solicitada.');
  }
}
