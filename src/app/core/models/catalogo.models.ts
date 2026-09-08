export interface ProveedorDTO {
  id: string;
  razon_social: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  correo_electronico?: string;
  direccion?: string;
  convenio?: string;
  activo: boolean;
}

export interface ProveedorCrearDTO {
  razon_social: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  correo_electronico?: string;
  direccion?: string;
  convenio?: string;
  activo?: boolean;
}

export interface DetalleLoteCrearDTO {
  variante_id: string;
  cantidad: number;
  costo_unitario: number;
}

export interface LoteRecepcionCrearDTO {
  proveedor_id: string;
  sucursal_id: string;
  temporada_id?: string;
  coleccion_id?: string;
  recibido_por_id: string;
  numero_documento?: string;
  observacion?: string;
  detalles: DetalleLoteCrearDTO[];
}

export interface DetalleLoteDTO {
  id: string;
  lote_id: string;
  variante_id: string;
  cantidad: number;
  costo_unitario: number;
}

export interface LoteRecepcionDTO {
  id: string;
  proveedor_id: string;
  sucursal_id: string;
  temporada_id?: string;
  coleccion_id?: string;
  recibido_por_id: string;
  numero_documento?: string;
  fecha_recepcion: string;
  observacion?: string;
  detalles: DetalleLoteDTO[];
}

// Maestros
export interface TallaDTO { id: string; nombre: string; orden: number; activo: boolean; }
export interface ColorDTO { id: string; nombre: string; codigo_hex?: string; activo: boolean; }
export interface CategoriaDTO { id: string; nombre: string; descripcion?: string; categoria_padre_id?: string; activo: boolean; }
export interface TemporadaDTO { id: string; nombre: string; fecha_inicio?: string; fecha_fin?: string; activa: boolean; }
export interface ColeccionDTO { id: string; nombre: string; descripcion?: string; activa: boolean; }

export interface ProductoDTO {
  id: string;
  categoria_id?: string;
  proveedor_principal_id?: string;
  nombre: string;
  descripcion?: string;
  genero?: string;
  marca?: string;
  precio_base: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  imagenes: ImagenProductoDTO[];
  temporada_ids: string[];
  coleccion_ids: string[];
}

export interface ImagenProductoDTO {
  id: string;
  producto_id: string;
  enlace_imagen: string;
  texto_alternativo?: string;
  orden: number;
  es_principal: boolean;
}

export interface VarianteDTO {
  id: string;
  producto_id: string;
  talla_id: string;
  color_id: string;
  sku: string;
  codigo_barras?: string;
  precio: number;
  peso_gramos?: number;
  costo_promedio: number;
  costo_ultimo: number;
  recurso_prueba_virtual?: string;
  activa: boolean;
}

// Catálogo CU06
export interface CatalogoFiltroParams {
  texto?: string;
  categoria_id?: string;
  talla_id?: string;
  color_id?: string;
  temporada_id?: string;
  coleccion_id?: string;
  genero?: string;
  marca?: string;
  precio_min?: number;
  precio_max?: number;
  codigo_hex?: string;
}

export interface DisponibilidadItem {
  sucursal_id: string;
  sucursal_nombre: string;
  ciudad_nombre: string;
  direccion: string;
  disponible: number;
  reservado: number;
  comprometido_traslado: number;
  en_transito: number;
  actualizado_en: string;
}

// CU07
export interface MovimientoKardexDTO {
  id: string;
  variante_id: string;
  sucursal_origen_id?: string;
  sucursal_destino_id?: string;
  responsable_id?: string;
  tipo: string;
  cantidad: number;
  costo_unitario: number;
  referencia_tipo?: string;
  referencia_id?: string;
  fecha_hora: string;
  observacion?: string;
}

export interface ExistenciaDTO {
  id: string;
  variante_id: string;
  sku: string;
  producto_nombre: string;
  talla_nombre: string;
  color_nombre: string;
  codigo_hex?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  ciudad_nombre: string;
  disponible: number;
  reservado: number;
  comprometido_traslado: number;
  en_transito: number;
  existencia_total: number;
  costo_promedio: number;
  costo_ultimo: number;
  precio: number;
  valorizacion: number;
  actualizado_en: string;
}

export interface ValorizacionDTO {
  sucursal_id: string;
  sucursal_nombre: string;
  ciudad_nombre: string;
  total_existencia: number;
  valorizacion: number;
  margen_bruto_total?: number;
}

export interface ValorizacionGlobalDTO {
  total_existencia: number;
  valorizacion_total: number;
  detalle_por_sucursal: ValorizacionDTO[];
}
