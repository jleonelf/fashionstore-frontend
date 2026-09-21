import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CarritoService } from '../../core/services/carrito.service';
import { EntregaService } from '../../core/services/entrega.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { EnriquecimientoService, VarianteEnriquecida } from '../../core/services/enriquecimiento.service';
import { CarritoDTO, CoberturaDTO, CoberturaSucursalDTO, CotizacionDTO, ModalidadEntrega, CheckoutCrearDTO } from '../../core/models/ciclo3.models';
import { SucursalDTO } from '../../core/models/organizacion.models';
import { formatearBs, sumarImportes, aNumero, type DecimalApi } from '../../core/utils/moneda.util';
import { formatearErrorApi } from '../../core/utils/error-handler.util';

type Paso = 'resumen' | 'entrega' | 'confirmacion';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  paso: Paso = 'resumen';
  carrito: CarritoDTO | null = null;
  cobertura: CoberturaDTO | null = null;
  sucursales: SucursalDTO[] = [];
  cargando = true;
  procesando = false;
  error: string | null = null;

  cotizacion: CotizacionDTO | null = null;
  cotizando = false;
  prendasInfo: Map<string, VarianteEnriquecida> = new Map();

  // Formulario reactivo tipado
  checkoutForm = new FormGroup({
    sucursalId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    modalidad: new FormControl<ModalidadEntrega>('RECOJO', { nonNullable: true, validators: [Validators.required] }),
    direccion: new FormControl<string>('', { nonNullable: true }),
    anilloDestino: new FormControl<number | null>(null),
  });

  // Manejo de idempotencia estable por intento lógico
  private checkoutKey = crypto.randomUUID();
  private firmaIntentoPrevio: string | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private carritoService: CarritoService,
    private entregaService: EntregaService,
    private orgService: OrganizacionService,
    private enriquecimientoService: EnriquecimientoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();

    // Reaccionar a cambios en modalidad para ajustar validaciones
    this.checkoutForm.controls.modalidad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(mod => {
        this.cotizacion = null;
        if (mod === 'DELIVERY') {
          this.checkoutForm.controls.direccion.setValidators([Validators.required, Validators.minLength(5)]);
          this.checkoutForm.controls.anilloDestino.setValidators([Validators.required, Validators.min(1), Validators.max(12)]);
        } else {
          this.checkoutForm.controls.direccion.clearValidators();
          this.checkoutForm.controls.anilloDestino.clearValidators();
          this.checkoutForm.controls.direccion.setValue('');
          this.checkoutForm.controls.anilloDestino.setValue(null);
        }
        this.checkoutForm.controls.direccion.updateValueAndValidity();
        this.checkoutForm.controls.anilloDestino.updateValueAndValidity();
      });

    // Invalidar cotización al cambiar de sucursal y cambiar a RECOJO si no tiene delivery activo
    this.checkoutForm.controls.sucursalId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(nuevaSucursalId => {
        this.cotizacion = null;
        const suc = this.sucursalObj(nuevaSucursalId);
        if (suc && !suc.delivery_activo && this.checkoutForm.controls.modalidad.value === 'DELIVERY') {
          this.checkoutForm.controls.modalidad.setValue('RECOJO');
        }
      });

    // Invalidar cotización al cambiar de anillo
    this.checkoutForm.controls.anilloDestino.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cotizacion = null;
      });
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    this.carritoService.obtenerMio()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: c => {
          this.carrito = c;
          if (!c.lineas.length) {
            this.cargando = false;
            return;
          }

          // Cargar información descriptiva de prendas
          for (const linea of c.lineas) {
            this.enriquecimientoService.obtenerVariante(linea.variante_id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(info => this.prendasInfo.set(linea.variante_id, info));
          }

          this.carritoService.cobertura().subscribe({
            next: cob => {
              this.cobertura = cob;
              this.orgService.gestionarSucursales().subscribe({
                next: s => { this.sucursales = s; this.cargando = false; },
                error: e => { this.error = formatearErrorApi(e); this.cargando = false; }
              });
            },
            error: e => { this.error = formatearErrorApi(e); this.cargando = false; }
          });
        },
        error: e => { this.error = formatearErrorApi(e, 'No se pudo cargar el carrito.'); this.cargando = false; }
      });
  }

  sucursalesConCobertura(): CoberturaSucursalDTO[] {
    return this.cobertura?.sucursales.filter(s => s.cubre_todo) ?? [];
  }

  sucursalNombre(id: string): string {
    return this.sucursales.find(s => s.id === id)?.nombre ?? 'Sucursal seleccionada';
  }

  sucursalObj(id: string): SucursalDTO | undefined {
    return this.sucursales.find(s => s.id === id);
  }

  nombrePrenda(varianteId: string): string {
    const info = this.prendasInfo.get(varianteId);
    if (!info) return 'Prenda en selección';
    const attr = [info.talla_nombre, info.color_nombre].filter(Boolean).join(' / ');
    return attr ? `${info.nombre_producto} (${attr})` : info.nombre_producto;
  }

  skuPrenda(varianteId: string): string {
    return this.prendasInfo.get(varianteId)?.sku ?? '—';
  }

  avanzar(): void {
    if (this.paso === 'resumen') {
      if (!this.checkoutForm.controls.sucursalId.valid) {
        this.checkoutForm.controls.sucursalId.markAsTouched();
        return;
      }
      this.paso = 'entrega';
    } else if (this.paso === 'entrega') {
      if (!this.puedeConfirmar) {
        this.checkoutForm.markAllAsTouched();
        return;
      }
      this.paso = 'confirmacion';
    }
  }

  retroceder(): void {
    if (this.paso === 'entrega') this.paso = 'resumen';
    else if (this.paso === 'confirmacion') this.paso = 'entrega';
  }

  cotizar(): void {
    const sid = this.checkoutForm.controls.sucursalId.value;
    const anillo = this.checkoutForm.controls.anilloDestino.value;
    if (!sid || !anillo) return;

    this.cotizando = true;
    this.cotizacion = null;
    this.entregaService.cotizar(sid, anillo)
      .subscribe({
        next: c => { this.cotizacion = c; this.cotizando = false; },
        error: e => { this.error = formatearErrorApi(e, 'No se pudo cotizar el delivery.'); this.cotizando = false; }
      });
  }

  get sucursalSeleccionada(): string {
    return this.checkoutForm.controls.sucursalId.value;
  }

  get modalidadSeleccionada(): ModalidadEntrega {
    return this.checkoutForm.controls.modalidad.value;
  }

  get direccionValor(): string {
    return this.checkoutForm.controls.direccion.value;
  }

  get anilloValor(): number | null {
    return this.checkoutForm.controls.anilloDestino.value;
  }

  get cotizacionEsVigente(): boolean {
    if (this.modalidadSeleccionada !== 'DELIVERY') return true;
    return !!(
      this.cotizacion &&
      this.cotizacion.sucursal_id === this.sucursalSeleccionada &&
      this.cotizacion.anillo_destino === this.anilloValor
    );
  }

  get requiereRecalcularCotizacion(): boolean {
    if (this.modalidadSeleccionada !== 'DELIVERY') return false;
    return (
      !!this.sucursalSeleccionada &&
      this.anilloValor !== null &&
      !this.cotizacionEsVigente
    );
  }

  get totalVisible(): number {
    const costoEntrega = this.modalidadSeleccionada === 'DELIVERY' && this.cotizacionEsVigente
      ? this.cotizacion?.costo_entrega
      : 0;
    return sumarImportes(this.carrito?.total, costoEntrega);
  }

  get puedeConfirmar(): boolean {
    if (!this.checkoutForm.controls.sucursalId.valid || !this.carrito?.lineas.length) return false;
    if (this.modalidadSeleccionada === 'DELIVERY') {
      const suc = this.sucursalObj(this.sucursalSeleccionada);
      if (!suc || !suc.delivery_activo) return false;
      return (
        this.checkoutForm.controls.direccion.valid &&
        this.checkoutForm.controls.anilloDestino.valid &&
        this.cotizacionEsVigente
      );
    }
    return true;
  }

  confirmarCheckout(): void {
    if (this.procesando || !this.puedeConfirmar) return;
    this.procesando = true;
    this.error = null;

    const sid = this.sucursalSeleccionada;
    const mod = this.modalidadSeleccionada;
    const dir = this.direccionValor.trim();
    const anillo = this.anilloValor;

    const dto: CheckoutCrearDTO = {
      sucursal_id: sid,
      canal: 'WEB',
      modalidad: mod,
    };
    if (mod === 'DELIVERY') {
      dto.direccion = dir;
      dto.anillo_destino = anillo!;
    }

    // Identificador de contenido lógico para idempotencia estable
    const firmaLineas = (this.carrito?.lineas ?? []).map(l => `${l.variante_id}:${l.cantidad}`).sort().join(';');
    const firmaActual = `${sid}|${mod}|${dir}|${anillo ?? ''}|${firmaLineas}`;

    if (firmaActual !== this.firmaIntentoPrevio) {
      // Cambio de parámetros o contenido: se genera una nueva clave lógica
      this.checkoutKey = crypto.randomUUID();
      this.firmaIntentoPrevio = firmaActual;
    }
    // Si la firma es idéntica (reintento técnico por red/timeout), se preserva la misma clave

    this.carritoService.checkout(dto, this.checkoutKey)
      .subscribe({
        next: resp => {
          this.procesando = false;
          this.router.navigate(['/pago', resp.venta_id]);
        },
        error: e => {
          this.error = formatearErrorApi(e, 'No se pudo confirmar la compra. Puedes reintentar.');
          this.procesando = false;
          // NOTA: No regeneramos clave aquí para permitir reintento seguro con la misma Idempotency-Key
        }
      });
  }

  get tieneDescuento(): boolean { return aNumero(this.carrito?.descuento_total) > 0; }
  get esVacio(): boolean { return !this.carrito?.lineas?.length; }
  bs(m: DecimalApi | null | undefined): string { return formatearBs(m); }
}
