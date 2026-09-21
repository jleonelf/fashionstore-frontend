import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NavegacionCrearDTO, RecomendacionPedirDTO, RecomendacionRespuestaDTO,
  BusquedaRespuestaDTO, ReportePedirDTO, ReporteRespuestaDTO,
  DecisionPedirDTO, DecisionRespuestaDTO
} from '../models/ciclo3.models';

@Injectable({ providedIn: 'root' })
export class IAService {
  private readonly api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  registrarNavegacion(dto: NavegacionCrearDTO): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.api}/ia/navegacion`, dto);
  }

  recomendaciones(dto: RecomendacionPedirDTO = {}): Observable<RecomendacionRespuestaDTO> {
    return this.http.post<RecomendacionRespuestaDTO>(`${this.api}/ia/recomendaciones`, dto);
  }

  buscar(texto: string): Observable<BusquedaRespuestaDTO> {
    return this.http.post<BusquedaRespuestaDTO>(`${this.api}/ia/busqueda`, { texto });
  }

  generarReporte(consulta: string): Observable<ReporteRespuestaDTO> {
    const dto: ReportePedirDTO = { consulta };
    return this.http.post<ReporteRespuestaDTO>(`${this.api}/ia/reportes`, dto);
  }

  decisionesInventario(dto: DecisionPedirDTO = {}): Observable<DecisionRespuestaDTO> {
    return this.http.post<DecisionRespuestaDTO>(`${this.api}/ia/decisiones-inventario`, dto);
  }
}
