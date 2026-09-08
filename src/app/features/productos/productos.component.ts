import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestroService } from '../../core/services/maestro.service';
import { ProductoService } from '../../core/services/producto.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { TallaDTO, ColorDTO, CategoriaDTO, TemporadaDTO, ColeccionDTO, ProductoDTO, VarianteDTO } from '../../core/models/catalogo.models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  activeTab: 'productos' | 'variantes' | 'maestros' = 'productos';

  // maestros
  tallas: TallaDTO[] = []; colores: ColorDTO[] = []; categorias: CategoriaDTO[] = []; temporadas: TemporadaDTO[] = []; colecciones: ColeccionDTO[] = [];
  nuevo = { talla: '', color: '', colorHex: '#4f46e5', categoria: '', temporada: '', coleccion: '' };
  guardandoMaestro = false;

  // productos
  productos: ProductoDTO[] = []; variantes: VarianteDTO[] = [];
  productoForm: any = { nombre: '', descripcion: '', categoria_id: '', proveedor_principal_id: '', genero: '', marca: '', precio_base: 0, temporada_ids: [], coleccion_ids: [] };
  varianteForm: any = { producto_id: '', talla_id: '', color_id: '', sku: '', codigo_barras: '', precio: 0, peso_gramos: null };

  cargando = false; guardandoProd = false; guardandoVar = false;
  mensajeError: string | null = null; mensajeExito: string | null = null;

  constructor(private maestroService: MaestroService, private productoService: ProductoService, private orgService: OrganizacionService) {}

  ngOnInit(): void { this.cargarMaestros(); this.cargarProductos(); this.cargarVariantes(); }

  cargarMaestros(): void {
    this.maestroService.gestionarTallas().subscribe(d => this.tallas = d);
    this.maestroService.gestionarColores().subscribe(d => this.colores = d);
    this.maestroService.gestionarCategorias().subscribe(d => this.categorias = d);
    this.maestroService.gestionarTemporadas().subscribe(d => this.temporadas = d);
    this.maestroService.gestionarColecciones().subscribe(d => this.colecciones = d);
  }
  cargarProductos(): void { this.productoService.gestionarProductos().subscribe(d => this.productos = d); }
  cargarVariantes(): void { this.productoService.gestionarVariantes().subscribe(d => this.variantes = d); }

  crearTalla(): void {
    if (!this.nuevo.talla.trim()) { this.mensajeError = 'Nombre talla requerido'; return; }
    this.guardandoMaestro = true;
    this.maestroService.crearTalla({ nombre: this.nuevo.talla.trim() }).subscribe({
      next: t => { this.mensajeExito = `Talla "${t.nombre}" creada`; this.nuevo.talla = ''; this.guardandoMaestro = false; this.cargarMaestros(); },
      error: e => { this.mensajeError = e.error?.detail || 'Error talla'; this.guardandoMaestro = false; }
    });
  }
  crearColor(): void {
    if (!this.nuevo.color.trim()) { this.mensajeError = 'Nombre color requerido'; return; }
    this.guardandoMaestro = true;
    this.maestroService.crearColor({ nombre: this.nuevo.color.trim(), codigo_hex: this.nuevo.colorHex }).subscribe({
      next: c => { this.mensajeExito = `Color "${c.nombre}" ${c.codigo_hex} creado`; this.nuevo.color = ''; this.guardandoMaestro = false; this.cargarMaestros(); },
      error: e => { this.mensajeError = e.error?.detail || 'Error color (hex #RRGGBB)'; this.guardandoMaestro = false; }
    });
  }
  crearCategoria(): void {
    if (!this.nuevo.categoria.trim()) { this.mensajeError = 'Categoría requerida'; return; }
    this.maestroService.crearCategoria({ nombre: this.nuevo.categoria.trim() }).subscribe({
      next: c => { this.mensajeExito = `Categoría "${c.nombre}" creada`; this.nuevo.categoria = ''; this.cargarMaestros(); },
      error: e => this.mensajeError = e.error?.detail || 'Error categoría'
    });
  }
  crearTemporada(): void {
    if (!this.nuevo.temporada.trim()) { this.mensajeError = 'Temporada requerida'; return; }
    this.maestroService.crearTemporada({ nombre: this.nuevo.temporada.trim() }).subscribe({
      next: t => { this.mensajeExito = `Temporada "${t.nombre}" creada`; this.nuevo.temporada = ''; this.cargarMaestros(); },
      error: e => this.mensajeError = e.error?.detail || 'Error temporada'
    });
  }
  crearColeccion(): void {
    if (!this.nuevo.coleccion.trim()) { this.mensajeError = 'Colección requerida'; return; }
    this.maestroService.crearColeccion({ nombre: this.nuevo.coleccion.trim() }).subscribe({
      next: c => { this.mensajeExito = `Colección "${c.nombre}" creada`; this.nuevo.coleccion = ''; this.cargarMaestros(); },
      error: e => this.mensajeError = e.error?.detail || 'Error colección'
    });
  }

  crearProducto(): void {
    if (!this.productoForm.nombre.trim() || this.productoForm.precio_base < 0) { this.mensajeError = 'Nombre y precio ≥0 requeridos'; return; }
    this.guardandoProd = true; this.mensajeError = null;
    const payload: any = { ...this.productoForm, precio_base: Number(this.productoForm.precio_base) };
    if (!payload.categoria_id) delete payload.categoria_id;
    this.productoService.crearProducto(payload).subscribe({
      next: p => { this.mensajeExito = `Producto "${p.nombre}" creado — ahora crea su variante`; this.productoForm = { nombre: '', descripcion: '', categoria_id: '', proveedor_principal_id: '', genero: '', marca: '', precio_base: 0, temporada_ids: [], coleccion_ids: [] }; this.guardandoProd = false; this.cargarProductos(); },
      error: e => { this.mensajeError = e.error?.detail || JSON.stringify(e.error) || 'Error producto'; this.guardandoProd = false; }
    });
  }

  crearVariante(): void {
    if (!this.varianteForm.producto_id || !this.varianteForm.talla_id || !this.varianteForm.color_id || !this.varianteForm.sku.trim() || this.varianteForm.precio < 0) {
      this.mensajeError = 'Producto, talla, color, SKU y precio ≥0 requeridos (*)'; return;
    }
    this.guardandoVar = true; this.mensajeError = null;
    const payload = { ...this.varianteForm, precio: Number(this.varianteForm.precio), sku: this.varianteForm.sku.trim(), codigo_barras: this.varianteForm.codigo_barras?.trim() || null };
    this.productoService.crearVariante(payload).subscribe({
      next: v => { this.mensajeExito = `Variante ${v.sku} creada — UQ producto+talla+color OK`; this.varianteForm = { producto_id: '', talla_id: '', color_id: '', sku: '', codigo_barras: '', precio: 0, peso_gramos: null }; this.guardandoVar = false; this.cargarVariantes(); },
      error: e => { this.mensajeError = e.error?.detail || JSON.stringify(e.error) || 'Error variante (¿SKU duplicado o UQ?)'; this.guardandoVar = false; }
    });
  }

  productoNombre(id: string): string { return this.productos.find(p => p.id === id)?.nombre || id.slice(0, 8); }
  tallaNombre(id: string): string { return this.tallas.find(t => t.id === id)?.nombre || id.slice(0, 8); }
  colorObj(id: string): ColorDTO | undefined { return this.colores.find(c => c.id === id); }
}
