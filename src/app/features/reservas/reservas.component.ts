import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Ciclo2Service } from '../../core/services/ciclo2.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ProductoService } from '../../core/services/producto.service';
import { EstadoReserva, MetodoCaja, Reserva } from '../../core/models/ciclo2.models';
import { SucursalDTO } from '../../core/models/organizacion.models';
import { VarianteDTO } from '../../core/models/catalogo.models';
import { formatearErrorApi } from '../../core/utils/error-handler.util';
import {
  bloquearScrollBody,
  desbloquearScrollBody,
  atraparFocoModal,
  enfocarPrimerElemento,
  devolverFocoDisparador
} from '../../core/utils/modal-accessibility.util';

@Component({ selector: 'app-reservas', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './reservas.component.html', styleUrls: ['./reservas.component.css'] })
export class ReservasComponent implements OnInit, OnDestroy {
  reservas: Reserva[] = []; sucursales: SucursalDTO[] = []; variantes: VarianteDTO[] = [];
  cargando = false; procesando = ''; error = ''; exito = ''; filtroEstado = '';
  modal: 'crear'|'cancelar'|'adelanto'|null = null; seleccionada?: Reserva;
  destino = ''; fechaVisita = ''; observacion = ''; nuevaVariante = ''; nuevaCantidad = 1; nuevoOrigen = '';
  lineas: { variante_id: string; cantidad: number; sucursal_origen_id?: string }[] = [];
  metodo: MetodoCaja = 'EFECTIVO'; private polling?: Subscription;
  errorHorario = '';
  readonly estados: EstadoReserva[] = ['PENDIENTE_TRASLADO','PENDIENTE','PREPARADA','ATENDIDA','COMPLETADA','CANCELADA','VENCIDA'];

  @ViewChild('modalDialog') modalDialog?: ElementRef<HTMLElement>;
  private disparadorPrevio: HTMLElement | null = null;

  constructor(public auth: AuthService, private api: Ciclo2Service, private org: OrganizacionService, private productos: ProductoService) {}

  ngOnInit(): void {
    forkJoin([this.org.gestionarSucursales(), this.productos.gestionarVariantes()]).subscribe({ next: ([s, v]) => { this.sucursales = s; this.variantes = v; }, error: () => this.error = 'No pudimos cargar las opciones para gestionar reservas.' });
    this.cargar();
    if (this.esPersonal) this.polling = interval(30000).subscribe(() => { if (!document.hidden && !this.modal) this.cargar(false); });
  }

  ngOnDestroy(): void {
    this.polling?.unsubscribe();
    if (this.modal) {
      desbloquearScrollBody();
    }
  }

  @HostListener('keydown.escape')
  alPresionarEscape(): void {
    if (this.modal && !this.procesando) {
      this.cerrarModal();
    }
  }

  alManejarTabModal(event: KeyboardEvent): void {
    if (this.modalDialog) {
      atraparFocoModal(event, this.modalDialog.nativeElement);
    }
  }

  abrirModal(tipo: 'crear'|'cancelar'|'adelanto', r?: Reserva, event?: Event): void {
    this.disparadorPrevio = (event?.currentTarget as HTMLElement) || (document.activeElement as HTMLElement);
    this.seleccionada = r;
    this.modal = tipo;
    this.error = '';
    bloquearScrollBody();
    setTimeout(() => {
      if (this.modalDialog) {
        enfocarPrimerElemento(this.modalDialog.nativeElement);
      }
    }, 50);
  }

  cerrarModal(): void {
    if (this.modal) {
      desbloquearScrollBody();
      this.modal = null;
    }
    devolverFocoDisparador(this.disparadorPrevio);
    this.disparadorPrevio = null;
  }

  get usuario() { return this.auth.obtenerUsuarioActual(); }
  get esCliente(): boolean { return this.usuario?.rol === 'CLIENTE'; }
  get esPersonal(): boolean { return ['ADMINISTRADOR','ENCARGADO'].includes(this.usuario?.rol || ''); }
  get puedePreparar(): boolean { return ['ADMINISTRADOR','ENCARGADO'].includes(this.usuario?.rol || ''); }

  cargar(mostrar = true): void {
    if (!this.usuario) return;
    if (mostrar) this.cargando = true; this.error = '';
    const req = this.esCliente ? this.api.listarReservas({ estado: this.filtroEstado }) : this.api.panelReservas(this.usuario.sucursal_id || this.destino, this.filtroEstado);
    if (!this.esCliente && !this.usuario.sucursal_id && !this.destino) { this.cargando = false; return; }
    req.subscribe({ next: p => { this.reservas = p.items; this.cargando = false; }, error: e => { this.error = this.mensaje(e); this.cargando = false; } });
  }

  validarHorarioVisita(): void {
    this.errorHorario = '';
    if (!this.fechaVisita) return;
    const d = new Date(this.fechaVisita);
    if (isNaN(d.getTime())) return;
    const ahora = new Date();
    if (d.getTime() < ahora.getTime() - 60000) {
      this.errorHorario = 'La fecha de visita no puede ser anterior al momento actual.';
      return;
    }
    const horas = d.getHours();
    const minutos = d.getMinutes();
    if (horas < 9 || horas > 20 || (horas === 20 && minutos > 0)) {
      this.errorHorario = 'Hora fuera de horario de atención. El horario de atención es de 09:00 a 20:00.';
    }
  }

  agregarLinea(): void {
    if (!this.nuevaVariante || this.nuevaCantidad < 1) return;
    const existente = this.lineas.find(x => x.variante_id === this.nuevaVariante);
    if (existente) existente.cantidad += this.nuevaCantidad;
    else this.lineas.push({ variante_id: this.nuevaVariante, cantidad: this.nuevaCantidad, sucursal_origen_id: this.nuevoOrigen || undefined });
    this.nuevaVariante=''; this.nuevaCantidad=1; this.nuevoOrigen='';
  }

  quitarLinea(i: number): void { this.lineas.splice(i, 1); }

  crear(): void {
    this.error = '';
    this.errorHorario = '';
    if (this.fechaVisita) {
      this.validarHorarioVisita();
      if (this.errorHorario) return;
    }
    if (!this.destino || !this.lineas.length || this.procesando) return;
    this.procesando='crear';
    this.api.crearReserva({
      sucursal_destino_id: this.destino,
      fecha_visita: this.fechaVisita ? new Date(this.fechaVisita).toISOString() : undefined,
      observacion: this.observacion || undefined,
      lineas: this.lineas
    }).subscribe({
      next: r => {
        this.procesando='';
        this.cerrarModal();
        this.lineas=[];
        this.fechaVisita='';
        this.observacion='';
        this.errorHorario='';
        this.exito=`Reserva ${r.codigo} confirmada.`;
        this.cargar();
      },
      error: e => {
        this.procesando='';
        this.error=this.mensaje(e);
      }
    });
  }

  abrirAccion(tipo: 'cancelar'|'adelanto', r: Reserva, event?: Event): void {
    this.abrirModal(tipo, r, event);
  }

  confirmarCancelacion(): void {
    if (!this.seleccionada || this.procesando) return;
    this.procesando='cancelar';
    this.api.cancelarReserva(this.seleccionada.id).subscribe({
      next: () => {
        this.procesando='';
        this.cerrarModal();
        this.exito='La reserva fue cancelada y el inventario se actualizó.';
        this.cargar();
      },
      error: e => {
        this.procesando='';
        this.error=this.mensaje(e);
      }
    });
  }

  registrarAdelanto(): void {
    if (!this.seleccionada || this.procesando) return;
    this.procesando='adelanto';
    this.api.registrarAdelanto(this.seleccionada.id, this.metodo).subscribe({
      next: p => {
        this.procesando='';
        this.cerrarModal();
        this.exito=`Adelanto de Bs ${p.monto} registrado.`;
        this.cargar();
      },
      error: e => {
        this.procesando='';
        this.error=this.mensaje(e);
      }
    });
  }

  transicionar(r: Reserva, accion: 'preparar'|'atender'): void {
    if (this.procesando) return;
    this.procesando=r.id;
    const req=accion==='preparar'?this.api.prepararReserva(r.id):this.api.atenderReserva(r.id);
    req.subscribe({
      next: () => {
        this.procesando='';
        this.exito=accion==='preparar'?'Reserva preparada.':'Atención iniciada.';
        this.cargar();
      },
      error: e => {
        this.procesando='';
        this.error=this.mensaje(e);
      }
    });
  }

  variante(id: string): string {
    const v=this.variantes.find(x=>x.id===id);
    return v ? `${v.sku}` : 'Sin referencia';
  }

  sucursal(id: string): string {
    return this.sucursales.find(x=>x.id===id)?.nombre || 'No disponible';
  }

  etiqueta(valor: string): string { return valor.toLowerCase().replaceAll('_',' '); }
  puedeCancelar(r: Reserva): boolean { return ['PENDIENTE_TRASLADO','PENDIENTE','PREPARADA'].includes(r.estado); }
  private mensaje(e: unknown): string { return formatearErrorApi(e, 'No se pudo completar la operación. Intenta nuevamente.'); }
}
