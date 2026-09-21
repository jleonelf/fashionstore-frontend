import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IntencionDTO, EstadoPagoDTO } from '../models/ciclo3.models';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  crearIntencion(ventaId: string, idempotencyKey: string): Observable<IntencionDTO> {
    return this.http.post<IntencionDTO>(
      `${this.api}/pagos/stripe/intenciones`,
      { venta_id: ventaId },
      { headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }) }
    );
  }

  reintentar(ventaId: string, idempotencyKey: string): Observable<IntencionDTO> {
    return this.http.post<IntencionDTO>(
      `${this.api}/pagos/stripe/intenciones/reintento`,
      { venta_id: ventaId },
      { headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }) }
    );
  }

  consultarEstado(ventaId: string): Observable<EstadoPagoDTO> {
    return this.http.get<EstadoPagoDTO>(`${this.api}/pagos/stripe/estado/${ventaId}`);
  }

  /**
   * Carga Stripe.js de forma dinámica.
   * Retorna el objeto Stripe global.
   */
  cargarStripeJs(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const win = window as unknown as Record<string, unknown>;
      if (win['Stripe']) {
        resolve(win['Stripe']);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve((window as unknown as Record<string, unknown>)['Stripe']);
      script.onerror = () => reject(new Error('No se pudo cargar Stripe.js'));
      document.head.appendChild(script);
    });
  }
}
