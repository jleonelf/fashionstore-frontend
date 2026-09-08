import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { MovimientoKardexDTO, ExistenciaDTO, ValorizacionDTO, VarianteDTO } from '../../core/models/catalogo.models';
import { SucursalDTO } from '../../core/models/organizacion.models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  tab: 'kardex' | 'existencias' | 'valorizacion' = 'kardex';

  // filtros
  sucursales: SucursalDTO[] = []; variantes: VarianteDTO[] = [];
  filtroSucursal = ''; filtroVariante = ''; filtroTipo = '';

  kardex: MovimientoKardexDTO[] = [];
  existencias: ExistenciaDTO[] = [];
  valorizacion: ValorizacionDTO[] = [];

  cargando = false; mensajeError: string | null = null;
  tipos = ['RECEPCION_PROVEEDOR','RESERVA','LIBERACION_RESERVA','COMPROMISO_TRASLADO','DESPACHO_TRASLADO','RECEPCION_TRASLADO','VENTA_PRESENCIAL','VENTA_DIGITAL','DEVOLUCION','MERMA','AJUSTE'];
  esEncargadoOCajero = false;
  sucursalFija = '';

  constructor(private inventarioService: InventarioService, private orgService: OrganizacionService, private productoService: ProductoService, private authService: AuthService) {}

  ngOnInit(): void {
    const u = this.authService.obtenerUsuarioActual();
    if (u && ['ENCARGADO','CAJERO'].includes(u.rol)) {
      this.esEncargadoOCajero = true;
      this.sucursalFija = u.sucursal_id || '';
      this.filtroSucursal = this.sucursalFija;
      this.sucursales = u.sucursal_nombre ? [{ id: u.sucursal_id!, nombre: u.sucursal_nombre } as SucursalDTO] : [];
    } else {
      this.orgService.gestionarSucursales().subscribe(d => this.sucursales = d);
    }
    this.productoService.gestionarVariantes().subscribe(d => this.variantes = d);
    this.cargarKardex(); this.cargarExistencias(); this.cargarValorizacion();
  }

  cargarKardex(): void {
    this.cargando = true;
    this.inventarioService.consultarKardex({ variante_id: this.filtroVariante || undefined, sucursal_id: this.filtroSucursal || undefined, tipo: this.filtroTipo || undefined }).subscribe({
      next: d => { this.kardex = d; this.cargando = false; },
      error: () => { this.mensajeError = 'Error cargando Kardex'; this.cargando = false; }
    });
  }
  cargarExistencias(): void {
    this.inventarioService.consultarExistencias(this.filtroSucursal || undefined).subscribe(d => this.existencias = d);
  }
  cargarValorizacion(): void {
    this.inventarioService.consultarValorizacion(this.filtroSucursal || undefined).subscribe(d => this.valorizacion = d);
  }

  aplicarFiltros(): void {
    this.cargarKardex(); this.cargarExistencias(); this.cargarValorizacion();
  }

  limpiar(): void { 
    this.filtroSucursal = this.esEncargadoOCajero ? this.sucursalFija : ''; 
    this.filtroVariante = ''; this.filtroTipo = ''; this.aplicarFiltros(); 
  }

  get totalValorizacion(): number { return this.valorizacion.reduce((s, v) => s + Number(v.valorizacion || 0), 0); }
  get totalExistencia(): number { return this.valorizacion.reduce((s, v) => s + Number(v.total_existencia || 0), 0); }

  tipoClass(t: string): string {
    if (t === 'RECEPCION_PROVEEDOR') return 't-rec';
    if (t.startsWith('VENTA')) return 't-venta';
    if (t.includes('TRASLADO')) return 't-tras';
    if (t === 'MERMA') return 't-merma';
    return 't-def';
  }
}
