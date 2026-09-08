import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecepcionService } from '../../core/services/recepcion.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ProductoService } from '../../core/services/producto.service';
import { ProveedorDTO, LoteRecepcionDTO, VarianteDTO } from '../../core/models/catalogo.models';
import { SucursalDTO, CiudadDTO } from '../../core/models/organizacion.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recepciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recepciones.component.html',
  styleUrls: ['./recepciones.component.css']
})
export class RecepcionesComponent implements OnInit {
  proveedores: ProveedorDTO[] = [];
  lotes: LoteRecepcionDTO[] = [];
  sucursales: SucursalDTO[] = [];
  ciudades: CiudadDTO[] = [];
  variantes: VarianteDTO[] = [];

  // Formularios
  nuevoProveedor: any = { razon_social: '', nit: '', contacto: '', telefono: '', correo_electronico: '', direccion: '' };
  loteForm: any = {
    proveedor_id: '', sucursal_id: '', numero_documento: '', observacion: '',
    detalles: [{ variante_id: '', cantidad: 1, costo_unitario: 0 }]
  };

  cargando = false; guardandoProv = false; guardandoLote = false;
  mensajeError: string | null = null; mensajeExito: string | null = null;
  tab: 'proveedores' | 'lotes' = 'lotes';

  constructor(
    private recepcionService: RecepcionService,
    private orgService: OrganizacionService,
    private productoService: ProductoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores(); this.cargarLotes(); this.cargarSucursales(); this.cargarVariantes();
  }

  cargarProveedores(): void {
    this.recepcionService.gestionarProveedores().subscribe({ next: d => this.proveedores = d, error: () => this.mensajeError = 'Error cargando proveedores' });
  }
  cargarLotes(): void {
    this.recepcionService.listarLotes().subscribe({ next: d => this.lotes = d, error: () => {} });
  }
  cargarSucursales(): void {
    this.orgService.gestionarSucursales().subscribe({ next: d => this.sucursales = d });
    this.orgService.gestionarCiudades().subscribe({ next: d => this.ciudades = d });
  }
  cargarVariantes(): void {
    this.productoService.gestionarVariantes().subscribe({ next: d => this.variantes = d });
  }

  crearProveedor(): void {
    if (!this.nuevoProveedor.razon_social.trim()) { this.mensajeError = 'Razón social requerida (*)'; return; }
    this.guardandoProv = true; this.mensajeError = null;
    this.recepcionService.registrarProveedor(this.nuevoProveedor).subscribe({
      next: p => {
        this.mensajeExito = `Proveedor "${p.razon_social}" registrado — RN-09 listo para recepción`;
        this.nuevoProveedor = { razon_social: '', nit: '', contacto: '', telefono: '', correo_electronico: '', direccion: '' };
        this.guardandoProv = false; this.cargarProveedores();
      },
      error: err => { this.mensajeError = err.error?.detail || 'Error al registrar proveedor'; this.guardandoProv = false; }
    });
  }

  agregarDetalle(): void {
    this.loteForm.detalles.push({ variante_id: '', cantidad: 1, costo_unitario: 0 });
  }
  quitarDetalle(i: number): void {
    this.loteForm.detalles.splice(i, 1);
  }

  registrarLote(): void {
    if (!this.loteForm.proveedor_id || !this.loteForm.sucursal_id || this.loteForm.detalles.length === 0) {
      this.mensajeError = 'Proveedor, sucursal y al menos un detalle son obligatorios (*)';
      return;
    }
    for (const d of this.loteForm.detalles) {
      if (!d.variante_id || d.cantidad <= 0 || d.costo_unitario < 0) { this.mensajeError = 'Cada detalle requiere variante, cantidad>0 y costo ≥0'; return; }
    }
    const usuario = this.authService.usuarioActualValue;
    if (!usuario?.id && !usuario?.usuario_id) { this.mensajeError = 'Debe iniciar sesión para registrar lotes (recibido_por_id)'; return; }
    const payload = {
      ...this.loteForm,
      recibido_por_id: usuario.usuario_id || usuario.id,
      detalles: this.loteForm.detalles.map((d: any) => ({ variante_id: d.variante_id, cantidad: Number(d.cantidad), costo_unitario: Number(d.costo_unitario) }))
    };
    this.guardandoLote = true; this.mensajeError = null;
    this.recepcionService.registrarLoteRecepcion(payload).subscribe({
      next: lote => {
        this.mensajeExito = `Lote ${lote.numero_documento || lote.id.slice(0, 8)} registrado: ${lote.detalles.length} variante(s) → disponible+ · costo promedio recalculado · Kardex RECEPCION_PROVEEDOR`;
        this.loteForm = { proveedor_id: '', sucursal_id: '', numero_documento: '', observacion: '', detalles: [{ variante_id: '', cantidad: 1, costo_unitario: 0 }] };
        this.guardandoLote = false; this.cargarLotes();
      },
      error: err => { this.mensajeError = err.error?.detail || JSON.stringify(err.error) || 'Error al registrar lote'; this.guardandoLote = false; }
    });
  }

  varianteLabel(v: VarianteDTO): string {
    return `${v.sku} · Bs ${v.precio} · costo ${v.costo_promedio}`;
  }
  sucursalLabel(s: SucursalDTO): string {
    return `${s.nombre} — ${s.direccion} (Anillo ${s.numero_anillo ?? '—'})`;
  }
}
