/* Tipos de dominio para compra digital y gestión FashionStore */

export type DecimalApi = string | number;

// Literales cerrados
export type CanalDigital      = 'WEB' | 'MOVIL';
export type ModalidadEntrega  = 'RECOJO' | 'DELIVERY';
export type EstadoPagoStripe  = 'SIN_INTENCION' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO';
export type EstadoVenta       = 'PENDIENTE_PAGO' | 'PAGADA' | 'CANCELADA' | 'PARCIALMENTE_DEVUELTA' | 'DEVUELTA';
export type EstadoPedido      = 'SOLICITADO' | 'PREPARADO' | 'LISTO_RECOJO' | 'EN_REPARTO' | 'RECOGIDO' | 'ENTREGADO' | 'CANCELADO';
export type SiguienteEstadoPedido = 'PREPARADO' | 'LISTO_RECOJO' | 'EN_REPARTO' | 'RECOGIDO' | 'ENTREGADO';
export type TipoPromocion     = 'PORCENTAJE' | 'MONTO_FIJO';
export type AccionDecision    = 'PROMOCION' | 'LIQUIDACION' | 'TRASLADO' | 'REPOSICION' | 'MANTENER';
export type FuncionReporte =
  | 'ventasPorSucursal'
  | 'inventarioPorSucursal'
  | 'ventasPorTemporada'
  | 'stockCritico'
  | 'topVendidos'
  | 'efectividadReservas'
  | 'rotacionPorTemporada';
export type EventoNavegacion  = 'VISTA' | 'PRUEBA_VIRTUAL' | 'CARRITO' | 'COMPRA' | 'BUSQUEDA';
export type EstadoCarrito     = 'ACTIVO' | 'CONVERTIDO' | 'ABANDONADO';

// Carrito
export interface LineaCarritoDTO {
  id: string;
  variante_id: string;
  cantidad: number;
  precio_unitario: DecimalApi;
  descuento_unitario: DecimalApi;
  promocion_id: string | null;
  subtotal: DecimalApi;
}

export interface CarritoDTO {
  id: string;
  cliente_id: string;
  canal: CanalDigital;
  estado: EstadoCarrito;
  creada_en: string;
  actualizada_en: string;
  lineas: LineaCarritoDTO[];
  subtotal: DecimalApi;
  descuento_total: DecimalApi;
  total: DecimalApi;
}

export interface LineaAgregarDTO {
  variante_id: string;
  cantidad: number;
}

export interface LineaActualizarDTO {
  cantidad: number;
}

export interface CoberturaSucursalDTO {
  sucursal_id: string;
  sucursal_nombre: string;
  cubre_todo: boolean;
  faltantes: string[];
}

export interface CoberturaDTO {
  sucursales: CoberturaSucursalDTO[];
}

export interface CheckoutCrearDTO {
  sucursal_id: string;
  canal: CanalDigital;
  modalidad: ModalidadEntrega;
  direccion?: string;
  anillo_destino?: number;
}

export interface CheckoutRespuestaDTO {
  venta_id: string;
  numero: string;
  estado: EstadoVenta;
  total: DecimalApi;
  expira_en: string;
  pedido_entrega_id: string;
}

// Stripe
export interface IntencionCrearDTO {
  venta_id: string;
}

export interface IntencionDTO {
  payment_intent_id: string;
  venta_id: string;
  monto: DecimalApi;
  moneda: string;
  estado: EstadoPagoStripe;
  client_secret: string | null;
}

export interface EstadoPagoDTO {
  venta_id: string;
  estado_venta: EstadoVenta;
  estado_pago: EstadoPagoStripe;
  payment_intent_id: string | null;
  monto: DecimalApi;
  expira_en: string | null;
}

// Entregas / Pedidos
export interface CotizacionDTO {
  sucursal_id: string;
  anillo_sucursal: number | null;
  anillo_destino: number;
  tarifa_base: DecimalApi;
  incremento_anillo: DecimalApi;
  costo_entrega: DecimalApi;
}

export interface PedidoDTO {
  id: string;
  venta_id: string;
  sucursal_id: string;
  modalidad: ModalidadEntrega;
  estado: EstadoPedido;
  anillo_sucursal: number | null;
  anillo_destino: number | null;
  direccion: string | null;
  tarifa_base: DecimalApi;
  incremento_anillo: DecimalApi;
  costo_entrega: DecimalApi;
  codigo_recojo: string | null;
  creada_en: string;
  puede_cancelar: boolean;
  puede_transicionar: boolean;
  siguiente_estado: SiguienteEstadoPedido | null;
}

export interface FiltrosPedidoDTO {
  sucursal_id?: string;
  estado?: string;
  limit?: number;
  offset?: number;
}

export interface PedidoListaDTO {
  total: number;
  limit: number;
  offset: number;
  items: PedidoDTO[];
}

export interface TransicionPedidoDTO {
  estado: EstadoPedido;
}

// Promociones
export interface PromocionCrearDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPromocion;
  valor: DecimalApi;
  activa?: boolean;
  vigencia_inicio?: string;
  vigencia_fin?: string;
  variante_ids?: string[];
}

export interface PromocionActualizarDTO {
  nombre?: string;
  descripcion?: string | null;
  tipo?: TipoPromocion;
  valor?: DecimalApi;
  activa?: boolean;
  vigencia_inicio?: string | null;
  vigencia_fin?: string | null;
}

export interface PromocionDTO {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoPromocion;
  valor: DecimalApi;
  activa: boolean;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
  creada_en: string;
  variante_ids: string[];
}

export interface PromocionListaDTO {
  total: number;
  limit: number;
  offset: number;
  items: PromocionDTO[];
}

export interface AsociarVariantesDTO {
  variante_ids: string[];
}

// Dashboard (Contrato real de backend/app/services/dashboard_service.py)
export interface DashboardSucursalItem {
  sucursal_id: string;
  sucursal_nombre: string;
  ventas: number;
  ingresos: DecimalApi;
}

export interface DashboardTopProducto {
  producto: string;
  unidades: number;
}

export interface DashboardStockCritico {
  sku: string;
  sucursal_id: string;
  disponible: number;
  existencia: number;
}

export interface ConversionReservasDTO {
  total: number;
  completadas: number;
  tasa: number;
}

export interface EfectividadPromocionesDTO {
  con_promocion: number;
  sin_promocion: number;
  descuento_total: DecimalApi;
}

export interface DashboardDTO {
  desde: string | null;
  hasta: string | null;
  ventas_total: number;
  ingresos_total: DecimalApi;
  margen_bruto_total: DecimalApi;
  ticket_promedio: DecimalApi;
  por_sucursal: DashboardSucursalItem[];
  top_productos: DashboardTopProducto[];
  stock_critico: DashboardStockCritico[];
  valorizacion_total: DecimalApi;
  conversion_reservas: ConversionReservasDTO;
  estados_pedidos: Record<string, number>;
  efectividad_promociones: EfectividadPromocionesDTO;
}

// IA
export interface NavegacionCrearDTO {
  evento: EventoNavegacion;
  variante_id?: string;
  producto_id?: string;
}

export interface RecomendacionPedirDTO {
  limite?: number;
  categoria?: string;
  talla?: string;
}

export interface RecomendacionItemDTO {
  producto_id: string;
  variante_id: string;
  nombre: string;
  precio: DecimalApi;
  disponible: number;
  motivo: string;
}

export interface RecomendacionRespuestaDTO {
  items: RecomendacionItemDTO[];
  proveedor: string;
}

export interface BusquedaVozDTO {
  texto: string;
}

export interface FiltrosBusquedaDTO {
  categoria?: string;
  talla?: string;
  color?: string;
  temporada?: string;
  precio_min?: DecimalApi;
  precio_max?: DecimalApi;
  texto?: string;
}

export interface BusquedaRespuestaDTO {
  filtros: FiltrosBusquedaDTO | Record<string, unknown>;
  total: number;
  items: RecomendacionItemDTO[];
  proveedor: string;
}

export interface ReportePedirDTO {
  consulta: string;
}

export interface ReporteRespuestaDTO {
  funcion_usada: FuncionReporte;
  parametros: Record<string, unknown>;
  datos: Record<string, unknown>;
  narrativa: string;
  proveedor: string;
}

export interface DecisionPedirDTO {
  dias_ventana?: number;
  umbral_rotacion?: number;
}

export interface DecisionItemDTO {
  variante_id: string;
  sku: string;
  accion: AccionDecision;
  detalle: string;
  stock_total: number;
  ventas_periodo: number;
  reposicion_sugerida: number;
}

export interface DecisionRespuestaDTO {
  items: DecisionItemDTO[];
  proveedor: string;
}

// Producto y Variante — DTOs tipados
export interface ImagenProductoCrearDTO {
  enlace_imagen: string;
  texto_alternativo?: string;
  orden?: number;
  es_principal?: boolean;
}

export interface ProductoCrearDTO {
  nombre: string;
  descripcion?: string | null;
  categoria_id?: string | null;
  proveedor_principal_id?: string | null;
  genero?: string | null;
  marca?: string | null;
  precio_base: DecimalApi;
  activo?: boolean;
  imagenes?: ImagenProductoCrearDTO[];
  temporada_ids?: string[];
  coleccion_ids?: string[];
}

export interface ProductoActualizarDTO {
  nombre?: string;
  descripcion?: string | null;
  categoria_id?: string | null;
  proveedor_principal_id?: string | null;
  genero?: string | null;
  marca?: string | null;
  precio_base?: DecimalApi;
  activo?: boolean;
  imagenes?: ImagenProductoCrearDTO[];
  temporada_ids?: string[];
  coleccion_ids?: string[];
}

export interface VarianteCrearDTO {
  producto_id: string;
  talla_id: string;
  color_id: string;
  sku: string;
  codigo_barras?: string | null;
  precio: DecimalApi;
  peso_gramos?: number | null;
  activa?: boolean;
  recurso_prueba_virtual?: string | null;
}

export interface VarianteActualizarDTO {
  sku?: string;
  codigo_barras?: string | null;
  precio?: DecimalApi;
  peso_gramos?: number | null;
  activa?: boolean;
  recurso_prueba_virtual?: string | null;
}

// Venta
export interface VentaDigitalDTO {
  id: string;
  numero: string;
  cliente_id: string | null;
  reserva_id: string | null;
  sucursal_id: string;
  cajero_id: string | null;
  canal: CanalDigital | 'PRESENCIAL';
  estado: EstadoVenta;
  subtotal: DecimalApi;
  descuento: DecimalApi;
  adelanto_descontado: DecimalApi;
  costo_entrega: DecimalApi;
  total: DecimalApi;
  creada_en: string;
  confirmada_en: string | null;
  expira_en: string | null;
  detalles: VentaDetalleDTO[];
}

export interface VentaDetalleDTO {
  id: string;
  detalle_reserva_id: string | null;
  variante_id: string;
  cantidad: number;
  precio_unitario: DecimalApi;
  descuento: DecimalApi;
  promocion_id: string | null;
  costo_promedio: DecimalApi | null;
}

// Paginación genérica
export interface Pagina<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}
