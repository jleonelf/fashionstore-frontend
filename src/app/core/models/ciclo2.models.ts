export type EstadoReserva = 'PENDIENTE_TRASLADO' | 'PENDIENTE' | 'PREPARADA' | 'ATENDIDA' | 'COMPLETADA' | 'CANCELADA' | 'VENCIDA';
export type EstadoTraslado = 'SOLICITADO' | 'APROBADO' | 'RECHAZADO' | 'DESPACHADO' | 'RECIBIDO' | 'CANCELADO';
export type MetodoCaja = 'EFECTIVO' | 'TARJETA_CAJA' | 'QR_CAJA' | 'TRANSFERENCIA';

export interface Pagina<T> { total: number; limit: number; offset: number; items: T[]; }
export interface LineaReservaCrear { variante_id: string; cantidad: number; sucursal_origen_id?: string; }
export interface ReservaCrear { sucursal_destino_id: string; fecha_visita?: string; observacion?: string; lineas: LineaReservaCrear[]; }
export interface DetalleReserva { id: string; variante_id: string; cantidad_solicitada: number; cantidad_reservada: number; cantidad_pendiente_traslado: number; cantidad_vendida: number; cantidad_liberada: number; estado_linea: string; }
export interface TrasladoResumen { id: string; sucursal_origen_id: string; sucursal_destino_id: string; estado: EstadoTraslado; }
export interface Reserva { id: string; cliente_id: string; sucursal_destino_id: string; codigo: string; estado: EstadoReserva; fecha_creacion: string; fecha_visita?: string; vence_en: string; observacion?: string; adelanto_modalidad?: string; adelanto_valor?: number; adelanto_monto?: number; preparada_en?: string; atendida_en?: string; detalles: DetalleReserva[]; traslados: TrasladoResumen[]; }
export interface DetalleTraslado { id: string; traslado_id: string; detalle_reserva_id?: string; variante_id: string; cantidad: number; }
export interface Traslado { id: string; reserva_id?: string; sucursal_origen_id: string; sucursal_destino_id: string; estado: EstadoTraslado; solicitado_por_id: string; aprobado_por_id?: string; fecha_solicitud: string; fecha_aprobacion?: string; fecha_despacho?: string; fecha_recepcion?: string; motivo_rechazo?: string; detalles: DetalleTraslado[]; }
export interface Pago { id: string; contexto: string; reserva_id?: string; venta_id?: string; metodo: string; tipo_pago?: string; modalidad_adelanto?: string; monto: number; no_reembolsable: boolean; estado: string; pagado_en?: string; }
export interface ItemVenta { detalle_reserva_id?: string; variante_id: string; cantidad: number; }
export interface VentaCrear { reserva_id?: string; sucursal_id: string; cliente_id?: string; metodo: MetodoCaja; items: ItemVenta[]; }
export interface DetalleVenta { id: string; detalle_reserva_id?: string; variante_id: string; cantidad: number; precio_unitario: number; descuento: number; costo_promedio?: number; }
export interface Venta { id: string; numero: string; cliente_id?: string; reserva_id?: string; sucursal_id: string; cajero_id?: string; canal: string; estado: string; subtotal: number; descuento: number; adelanto_descontado: number; costo_entrega: number; total: number; creada_en: string; confirmada_en?: string; detalles: DetalleVenta[]; }
export interface Comprobante extends Venta { reserva_codigo?: string; sucursal_nombre?: string; cajero_nombre?: string; pagos: Pago[]; }
export interface Devolucion { id: string; detalle_venta_id: string; venta_id: string; variante_id: string; sucursal_id: string; cantidad: number; costo_unitario: number; motivo?: string; responsable_id?: string; fecha_hora: string; }
export interface Merma { id: string; variante_id: string; sucursal_id: string; cantidad: number; costo_unitario: number; causa?: string; responsable_id?: string; fecha_hora: string; }
export interface VentaSucursal { id: string; numero: string; creada_en: string; cliente_id?: string; reserva_id?: string; canal: string; estado: string; unidades: number; subtotal: number; descuento: number; adelanto_descontado: number; total: number; costo_total?: number; margen_bruto?: number; }
export interface ReporteVentas { total: number; limit: number; offset: number; resumen: { total_ventas: number; unidades: number; monto_total: number; ticket_promedio: number; costo_total?: number; margen_bruto_total?: number; }; items: VentaSucursal[]; }
