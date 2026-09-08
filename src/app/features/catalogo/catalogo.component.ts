import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../core/services/catalogo.service';
import { MaestroService } from '../../core/services/maestro.service';
import { ProductoDTO, TallaDTO, ColorDTO, CategoriaDTO, TemporadaDTO, ColeccionDTO, DisponibilidadItem } from '../../core/models/catalogo.models';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent implements OnInit {
  productos: ProductoDTO[] = [];
  tallas: TallaDTO[] = []; colores: ColorDTO[] = []; categorias: CategoriaDTO[] = []; temporadas: TemporadaDTO[] = []; colecciones: ColeccionDTO[] = [];

  filtros: any = { texto: '', categoria_id: '', talla_id: '', color_id: '', temporada_id: '', coleccion_id: '', precio_min: '', precio_max: '', genero: '' };
  cargando = false; mensajeError: string | null = null;
  filtrosAbiertos = true;

  varSeleccionada: any = null;
  disponibilidad: DisponibilidadItem[] = [];
  cargandoDisp = false;

  constructor(private catalogoService: CatalogoService, private maestroService: MaestroService) {}

  ngOnInit(): void {
    this.cargarMaestros();
    this.filtrar();
    if (typeof window !== 'undefined' && window.innerWidth < 900) this.filtrosAbiertos = false;
  }

  cargarMaestros(): void {
    this.maestroService.gestionarTallas().subscribe(d => this.tallas = d);
    this.maestroService.gestionarColores().subscribe(d => this.colores = d);
    this.maestroService.gestionarCategorias().subscribe(d => this.categorias = d);
    this.maestroService.gestionarTemporadas().subscribe(d => this.temporadas = d);
    this.maestroService.gestionarColecciones().subscribe(d => this.colecciones = d);
  }

  filtrar(): void {
    this.cargando = true; this.mensajeError = null;
    const params: any = {};
    if (this.filtros.texto) params.texto = this.filtros.texto;
    if (this.filtros.categoria_id) params.categoria_id = this.filtros.categoria_id;
    if (this.filtros.talla_id) params.talla_id = this.filtros.talla_id;
    if (this.filtros.color_id) params.color_id = this.filtros.color_id;
    if (this.filtros.temporada_id) params.temporada_id = this.filtros.temporada_id;
    if (this.filtros.coleccion_id) params.coleccion_id = this.filtros.coleccion_id;
    if (this.filtros.precio_min) params.precio_min = this.filtros.precio_min;
    if (this.filtros.precio_max) params.precio_max = this.filtros.precio_max;
    if (this.filtros.genero) params.genero = this.filtros.genero;

    this.catalogoService.consultarCatalogo(params).subscribe({
      next: d => { this.productos = d; this.cargando = false; },
      error: () => { this.mensajeError = 'No se pudo consultar el catálogo. Verifica la conexión con la API.'; this.cargando = false; }
    });
  }

  limpiar(): void {
    this.filtros = { texto: '', categoria_id: '', talla_id: '', color_id: '', temporada_id: '', coleccion_id: '', precio_min: '', precio_max: '', genero: '' };
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

  get filtrosActivos(): {label:string, key:string, val:string, display:string}[] {
    const res: any[] = [];
    const map: Record<string, {arr:any[], field:string}> = {
      categoria_id: {arr: this.categorias, field:'nombre'},
      talla_id: {arr: this.tallas, field:'nombre'},
      color_id: {arr: this.colores, field:'nombre'},
      temporada_id: {arr: this.temporadas, field:'nombre'},
      coleccion_id: {arr: this.colecciones, field:'nombre'},
    };
    for (const k of Object.keys(map)) {
      if (this.filtros[k]) {
        const found = map[k].arr.find((x:any)=> x.id===this.filtros[k]);
        res.push({label:k.replace('_id',''), key:k, val:this.filtros[k], display: found ? found[map[k].field] : this.filtros[k]});
      }
    }
    if (this.filtros.genero) res.push({label:'género', key:'genero', val:this.filtros.genero, display:this.filtros.genero});
    if (this.filtros.precio_min || this.filtros.precio_max) res.push({label:'precio', key:'precio', val:'', display:`Bs ${this.filtros.precio_min||0} — ${this.filtros.precio_max||'∞'}`});
    if (this.filtros.texto) res.push({label:'búsqueda', key:'texto', val:this.filtros.texto, display:`"${this.filtros.texto}"`});
    return res;
  }

  quitarFiltro(key:string): void {
    if (key==='precio') { this.filtros.precio_min=''; this.filtros.precio_max=''; }
    else this.filtros[key]='';
    this.filtrar();
  }

  get countFiltros(): number { return this.filtrosActivos.length; }

  colorHex(id:string): string { return this.colores.find(c=>c.id===id)?.codigo_hex || '#e2e8f0'; }
  colorNombre(id:string): string { return this.colores.find(c=>c.id===id)?.nombre || '—'; }

  imagen(p: ProductoDTO): string {
    return (p.imagenes && p.imagenes.length) ? p.imagenes[0].enlace_imagen : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=60';
  }

  verDisponibilidad(producto: ProductoDTO): void {
    this.varSeleccionada = producto;
    this.disponibilidad = [];
    this.cargandoDisp = false;
  }

  verDisponibilidadVariante(varianteId: string, sku: string): void {
    this.cargandoDisp = true;
    this.catalogoService.consultarDisponibilidad(varianteId).subscribe({
      next: d => { this.disponibilidad = d; this.varSeleccionada = { sku }; this.cargandoDisp = false; },
      error: () => { this.cargandoDisp = false; }
    });
  }
}
