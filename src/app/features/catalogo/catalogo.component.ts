import { Component, OnInit, OnDestroy, DestroyRef, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogoService } from '../../core/services/catalogo.service';
import { MaestroService } from '../../core/services/maestro.service';
import { ProductoService } from '../../core/services/producto.service';
import { CarritoService } from '../../core/services/carrito.service';
import { AuthService } from '../../core/services/auth.service';
import { IAService } from '../../core/services/ia.service';
import { formatearErrorApi } from '../../core/utils/error-handler.util';
import {
  bloquearScrollBody,
  desbloquearScrollBody,
  atraparFocoModal,
  enfocarPrimerElemento,
  devolverFocoDisparador
} from '../../core/utils/modal-accessibility.util';
import {
  ProductoDTO, TallaDTO, ColorDTO, CategoriaDTO,
  TemporadaDTO, ColeccionDTO, DisponibilidadItem, VarianteDTO
} from '../../core/models/catalogo.models';
import { RecomendacionItemDTO } from '../../core/models/ciclo3.models';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent implements OnInit, OnDestroy {
  productos: ProductoDTO[] = [];
  tallas: TallaDTO[] = [];
  colores: ColorDTO[] = [];
  categorias: CategoriaDTO[] = [];
  temporadas: TemporadaDTO[] = [];
  colecciones: ColeccionDTO[] = [];

  filtros: {
    texto: string;
    categoria_id: string;
    talla_id: string;
    color_id: string;
    temporada_id: string;
    coleccion_id: string;
    precio_min: string;
    precio_max: string;
    genero: string;
  } = {
    texto: '',
    categoria_id: '',
    talla_id: '',
    color_id: '',
    temporada_id: '',
    coleccion_id: '',
    precio_min: '',
    precio_max: '',
    genero: ''
  };

  cargando = false;
  mensajeError: string | null = null;
  filtrosAbiertos = true;

  // Modal y selección de producto / variantes
  productoSeleccionado: ProductoDTO | null = null;
  variantesProducto: VarianteDTO[] = [];
  varianteSeleccionada: VarianteDTO | null = null;
  imagenActiva: string | null = null;
  cantidadAgregar = 1;
  cargandoVariantes = false;
  agregandoAlCarrito = false;
  mensajeCarritoExito: string | null = null;
  mensajeCarritoError: string | null = null;

  // Disponibilidad por sucursal
  disponibilidad: DisponibilidadItem[] = [];
  cargandoDisp = false;

  // Búsqueda asistida IA (solo texto)
  modoAsistenteIA = false;
  textoConsultaIA = '';
  cargandoIA = false;
  resultadoBusquedaIA: RecomendacionItemDTO[] = [];
  mensajeIA: string | null = null;

  // Recomendaciones IA
  recomendaciones: RecomendacionItemDTO[] = [];
  cargandoRecomendaciones = false;
  errorRecomendaciones: string | null = null;

  @ViewChild('modalProdBox') modalProdBox?: ElementRef<HTMLElement>;
  private triggerElement: HTMLElement | null = null;
  private modalAbierto = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private catalogoService: CatalogoService,
    private maestroService: MaestroService,
    private productoService: ProductoService,
    public carritoService: CarritoService,
    public authService: AuthService,
    private router: Router,
    private iaService: IAService
  ) {}

  ngOnInit(): void {
    this.cargarMaestros();
    this.filtrar();
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      this.filtrosAbiertos = false;
    }
    if (this.esCliente()) {
      this.cargarRecomendaciones();
    }
  }

  ngOnDestroy(): void {
    if (this.modalAbierto) {
      desbloquearScrollBody();
      this.modalAbierto = false;
    }
  }

  @HostListener('keydown.escape')
  alPresionarEscape(): void {
    if (this.productoSeleccionado) {
      this.cerrarModal();
    }
  }

  alManejarTabModal(event: KeyboardEvent): void {
    if (this.modalProdBox) {
      atraparFocoModal(event, this.modalProdBox.nativeElement);
    }
  }

  esVisitante(): boolean {
    return !this.authService.estaAutenticado();
  }

  esCliente(): boolean {
    return this.authService.obtenerUsuarioActual()?.rol === 'CLIENTE';
  }

  esPersonalInterno(): boolean {
    const rol = this.authService.obtenerUsuarioActual()?.rol;
    return rol === 'CAJERO' || rol === 'ENCARGADO' || rol === 'ADMINISTRADOR';
  }

  cargarMaestros(): void {
    this.maestroService.gestionarTallas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.tallas = d);
    this.maestroService.gestionarColores().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.colores = d);
    this.maestroService.gestionarCategorias().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.categorias = d);
    this.maestroService.gestionarTemporadas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.temporadas = d);
    this.maestroService.gestionarColecciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.colecciones = d);
  }

  filtrar(): void {
    this.cargando = true;
    this.mensajeError = null;
    const params: Record<string, string | number> = {};
    if (this.filtros.texto) params['texto'] = this.filtros.texto;
    if (this.filtros.categoria_id) params['categoria_id'] = this.filtros.categoria_id;
    if (this.filtros.talla_id) params['talla_id'] = this.filtros.talla_id;
    if (this.filtros.color_id) params['color_id'] = this.filtros.color_id;
    if (this.filtros.temporada_id) params['temporada_id'] = this.filtros.temporada_id;
    if (this.filtros.coleccion_id) params['coleccion_id'] = this.filtros.coleccion_id;
    if (this.filtros.precio_min) params['precio_min'] = Number(this.filtros.precio_min);
    if (this.filtros.precio_max) params['precio_max'] = Number(this.filtros.precio_max);
    if (this.filtros.genero) params['genero'] = this.filtros.genero;

    this.catalogoService.consultarCatalogo(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        this.productos = d;
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = formatearErrorApi(err, 'No se pudo consultar el catálogo.');
        this.cargando = false;
      }
    });
  }

  limpiar(): void {
    this.filtros = {
      texto: '',
      categoria_id: '',
      talla_id: '',
      color_id: '',
      temporada_id: '',
      coleccion_id: '',
      precio_min: '',
      precio_max: '',
      genero: ''
    };
    this.filtrar();
  }

  seleccionarTalla(id: string): void {
    this.filtros.talla_id = this.filtros.talla_id === id ? '' : id;
    this.filtrar();
  }

  seleccionarColor(id: string): void {
    this.filtros.color_id = this.filtros.color_id === id ? '' : id;
    this.filtrar();
  }

  seleccionarGenero(g: string): void {
    this.filtros.genero = this.filtros.genero === g ? '' : g;
    this.filtrar();
  }

  get filtrosActivos(): { label: string; key: string; val: string; display: string }[] {
    const res: { label: string; key: string; val: string; display: string }[] = [];
    const map: Record<string, { arr: { id: string; nombre: string }[]; label: string }> = {
      categoria_id: { arr: this.categorias, label: 'categoría' },
      talla_id: { arr: this.tallas, label: 'talla' },
      color_id: { arr: this.colores, label: 'color' },
      temporada_id: { arr: this.temporadas, label: 'temporada' },
      coleccion_id: { arr: this.colecciones, label: 'colección' }
    };
    for (const k of Object.keys(map)) {
      const val = (this.filtros as Record<string, string>)[k];
      if (val) {
        const found = map[k].arr.find(x => x.id === val);
        res.push({ label: map[k].label, key: k, val, display: found ? found.nombre : val });
      }
    }
    if (this.filtros.genero) res.push({ label: 'género', key: 'genero', val: this.filtros.genero, display: this.filtros.genero });
    if (this.filtros.precio_min || this.filtros.precio_max) {
      res.push({ label: 'precio', key: 'precio', val: '', display: `Bs ${this.filtros.precio_min || 0} — ${this.filtros.precio_max || '∞'}` });
    }
    if (this.filtros.texto) res.push({ label: 'búsqueda', key: 'texto', val: this.filtros.texto, display: `"${this.filtros.texto}"` });
    return res;
  }

  quitarFiltro(key: string): void {
    if (key === 'precio') {
      this.filtros.precio_min = '';
      this.filtros.precio_max = '';
    } else {
      (this.filtros as Record<string, string>)[key] = '';
    }
    this.filtrar();
  }

  get countFiltros(): number { return this.filtrosActivos.length; }

  colorHex(id: string): string { return this.colores.find(c => c.id === id)?.codigo_hex || '#e2e8f0'; }
  colorNombre(id: string): string { return this.colores.find(c => c.id === id)?.nombre || '—'; }
  tallaNombre(id: string): string { return this.tallas.find(t => t.id === id)?.nombre || '—'; }

  imagen(p: ProductoDTO): string {
    return (p.imagenes && p.imagenes.length)
      ? p.imagenes[0].enlace_imagen
      : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=60';
  }

  abrirDetalle(producto: ProductoDTO, event?: Event): void {
    this.triggerElement = (event?.currentTarget as HTMLElement) || (document.activeElement as HTMLElement);
    this.productoSeleccionado = producto;
    this.imagenActiva = this.imagen(producto);
    this.variantesProducto = [];
    this.varianteSeleccionada = null;
    this.disponibilidad = [];
    this.cantidadAgregar = 1;
    this.mensajeCarritoExito = null;
    this.mensajeCarritoError = null;
    this.cargandoVariantes = true;

    if (!this.modalAbierto) {
      bloquearScrollBody();
      this.modalAbierto = true;
    }
    setTimeout(() => {
      if (this.modalProdBox) {
        enfocarPrimerElemento(this.modalProdBox.nativeElement);
      }
    }, 50);

    this.productoService.gestionarVariantes(producto.id, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (vars) => {
        this.variantesProducto = vars;
        this.cargandoVariantes = false;
        if (vars.length > 0) {
          this.seleccionarVariante(vars[0]);
        }
      },
      error: (err) => {
        this.cargandoVariantes = false;
        this.mensajeCarritoError = formatearErrorApi(err, 'No se pudieron cargar las variantes de la prenda.');
      }
    });
  }

  cerrarModal(): void {
    this.productoSeleccionado = null;
    this.varianteSeleccionada = null;
    this.disponibilidad = [];
    this.mensajeCarritoExito = null;
    this.mensajeCarritoError = null;
    if (this.modalAbierto) {
      desbloquearScrollBody();
      this.modalAbierto = false;
    }
    devolverFocoDisparador(this.triggerElement);
    this.triggerElement = null;
  }

  seleccionarVariante(v: VarianteDTO): void {
    this.varianteSeleccionada = v;
    this.cantidadAgregar = 1;
    this.mensajeCarritoExito = null;
    this.mensajeCarritoError = null;
    this.cargandoDisp = true;

    this.catalogoService.consultarDisponibilidad(v.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        this.disponibilidad = d;
        this.cargandoDisp = false;
      },
      error: (err) => {
        this.cargandoDisp = false;
        this.mensajeCarritoError = formatearErrorApi(err, 'No se pudo consultar la disponibilidad de esta prenda.');
      }
    });
  }

  get stockDisponibleTotal(): number {
    return this.disponibilidad.reduce((sum, item) => sum + (item.disponible || 0), 0);
  }

  agregarAlCarrito(): void {
    if (!this.varianteSeleccionada) return;
    if (!this.esCliente()) {
      if (this.esVisitante()) {
        this.router.navigate(['/auth/login'], { queryParams: { redirectUrl: '/catalogo' } });
      }
      return;
    }

    this.agregandoAlCarrito = true;
    this.mensajeCarritoExito = null;
    this.mensajeCarritoError = null;

    this.carritoService.agregarLinea({
      variante_id: this.varianteSeleccionada.id,
      cantidad: this.cantidadAgregar || 1
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.agregandoAlCarrito = false;
        this.mensajeCarritoExito = `Agregaste ${this.cantidadAgregar} unidad(es) a tu carrito.`;
      },
      error: (err) => {
        this.agregandoAlCarrito = false;
        this.mensajeCarritoError = formatearErrorApi(err, 'No se pudo agregar la prenda al carrito.');
      }
    });
  }

  // ─── Búsqueda asistida por texto IA ───
  buscarConIA(): void {
    if (!this.esCliente() || !this.textoConsultaIA.trim()) return;
    this.cargandoIA = true;
    this.mensajeIA = null;
    this.resultadoBusquedaIA = [];

    this.iaService.buscar(this.textoConsultaIA.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.resultadoBusquedaIA = res.items || [];
        this.cargandoIA = false;
        if (this.resultadoBusquedaIA.length === 0) {
          this.mensajeIA = 'No se encontraron prendas para esa descripción. Intenta con otros términos.';
        }
      },
      error: (err) => {
        this.cargandoIA = false;
        this.mensajeIA = formatearErrorApi(err, 'No fue posible completar la búsqueda asistida en este momento.');
      }
    });
  }

  seleccionarResultadoIA(item: RecomendacionItemDTO): void {
    const p = this.productos.find(prod => prod.id === item.producto_id);
    if (p) {
      this.abrirDetalle(p);
    } else {
      this.productoService.obtenerProducto(item.producto_id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (prod) => this.abrirDetalle(prod),
        error: (err) => {
          this.mensajeError = formatearErrorApi(err, 'No se pudo cargar el detalle de la prenda seleccionada.');
        }
      });
    }
  }

  // ─── Recomendaciones IA ───
  cargarRecomendaciones(): void {
    this.cargandoRecomendaciones = true;
    this.errorRecomendaciones = null;
    this.iaService.recomendaciones({ limite: 4 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.recomendaciones = res.items || [];
        this.cargandoRecomendaciones = false;
      },
      error: (err) => {
        this.cargandoRecomendaciones = false;
        this.recomendaciones = [];
        this.errorRecomendaciones = formatearErrorApi(err, 'No se pudieron cargar recomendaciones personalizadas.');
      }
    });
  }
}
