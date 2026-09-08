import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimientoKardexDTO, ExistenciaDTO, ValorizacionDTO } from '../models/catalogo.models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // CU07 - consultarKardex()
  consultarKardex(params: { variante_id?: string; sucursal_id?: string; tipo?: string; desde?: string; hasta?: string; limit?: number; offset?: number } = {}): Observable<MovimientoKardexDTO[]> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, String(v)); });
    return this.http.get<MovimientoKardexDTO[]>(`${this.api}/inventario/kardex`, { params: p });
  }

  // CU07 - consultarExistencias()
  consultarExistencias(sucursalId?: string): Observable<ExistenciaDTO[]> {
    let p = new HttpParams();
    if (sucursalId) p = p.set('sucursal_id', sucursalId);
    return this.http.get<ExistenciaDTO[]>(`${this.api}/inventario/existencias`, { params: p });
  }

  // CU07 - consultarValorizacion()
  consultarValorizacion(sucursalId?: string): Observable<ValorizacionDTO[]> {
    let p = new HttpParams();
    if (sucursalId) p = p.set('sucursal_id', sucursalId);
    return this.http.get<ValorizacionDTO[]>(`${this.api}/inventario/valorizacion`, { params: p });
  }
}
