import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comprobante, Devolucion, Merma, MetodoCaja, Pagina, Pago, ReporteVentas, Reserva, ReservaCrear, Traslado, Venta, VentaCrear } from '../models/ciclo2.models';

@Injectable({ providedIn: 'root' })
export class Ciclo2Service {
  private readonly api = environment.apiUrl;
  constructor(private http: HttpClient) {}
  private key(): HttpHeaders { return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() }); }
  private params(values: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value)); });
    return params;
  }
  crearReserva(dto: ReservaCrear): Observable<Reserva> { return this.http.post<Reserva>(`${this.api}/reservas`, dto, { headers: this.key() }); }
  listarReservas(filtros: Record<string, unknown> = {}): Observable<Pagina<Reserva>> { return this.http.get<Pagina<Reserva>>(`${this.api}/reservas`, { params: this.params(filtros) }); }
  panelReservas(sucursal: string, estado = ''): Observable<Pagina<Reserva>> { return this.http.get<Pagina<Reserva>>(`${this.api}/reservas/panel/cola`, { params: this.params({ sucursal, estado }) }); }
  reservaPorCodigo(codigo: string): Observable<Reserva> { return this.http.get<Reserva>(`${this.api}/reservas/codigo/${encodeURIComponent(codigo)}`); }
  cancelarReserva(id: string): Observable<Reserva> { return this.http.patch<Reserva>(`${this.api}/reservas/${id}/cancelar`, {}); }
  prepararReserva(id: string): Observable<Reserva> { return this.http.patch<Reserva>(`${this.api}/reservas/${id}/preparar`, {}); }
  atenderReserva(id: string): Observable<Reserva> { return this.http.patch<Reserva>(`${this.api}/reservas/${id}/atender`, {}); }
  registrarAdelanto(reserva_id: string, metodo: MetodoCaja): Observable<Pago> { return this.http.post<Pago>(`${this.api}/pagos/adelantos`, { reserva_id, metodo }, { headers: this.key() }); }
  listarTraslados(filtros: Record<string, unknown> = {}): Observable<Pagina<Traslado>> { return this.http.get<Pagina<Traslado>>(`${this.api}/traslados`, { params: this.params(filtros) }); }
  solicitarTraslado(detalle_reserva_id: string, sucursal_origen_id: string): Observable<Traslado> { return this.http.post<Traslado>(`${this.api}/traslados/solicitudes`, { detalle_reserva_id, sucursal_origen_id }, { headers: this.key() }); }
  transicionarTraslado(id: string, accion: 'aprobar'|'despachar'|'recibir'): Observable<Traslado> { return this.http.patch<Traslado>(`${this.api}/traslados/${id}/${accion}`, {}); }
  rechazarTraslado(id: string, motivo: string): Observable<Traslado> { return this.http.patch<Traslado>(`${this.api}/traslados/${id}/rechazar`, { motivo }); }
  registrarVenta(dto: VentaCrear): Observable<Venta> { return this.http.post<Venta>(`${this.api}/ventas/presenciales`, dto, { headers: this.key() }); }
  comprobante(id: string): Observable<Comprobante> { return this.http.get<Comprobante>(`${this.api}/ventas/${id}/comprobante`); }
  historial(clienteId: string, filtros: Record<string, unknown> = {}): Observable<Pagina<Venta>> { return this.http.get<Pagina<Venta>>(`${this.api}/clientes/${clienteId}/compras`, { params: this.params(filtros) }); }
  devolver(detalle_venta_id: string, cantidad: number, motivo?: string): Observable<Devolucion> { return this.http.post<Devolucion>(`${this.api}/devoluciones`, { detalle_venta_id, cantidad, motivo }, { headers: this.key() }); }
  registrarMerma(variante_id: string, sucursal_id: string, cantidad: number, causa: string): Observable<Merma> { return this.http.post<Merma>(`${this.api}/mermas`, { variante_id, sucursal_id, cantidad, causa }, { headers: this.key() }); }
  reporteVentas(sucursal: string, filtros: Record<string, unknown> = {}): Observable<ReporteVentas> { return this.http.get<ReporteVentas>(`${this.api}/reportes/ventas-sucursal`, { params: this.params({ sucursal, ...filtros }) }); }
}
