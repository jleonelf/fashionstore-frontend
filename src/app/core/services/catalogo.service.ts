import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductoDTO, CatalogoFiltroParams, DisponibilidadItem } from '../models/catalogo.models';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // CU06 - consultarCatalogo() / filtrarCatalogo()
  consultarCatalogo(params: CatalogoFiltroParams): Observable<ProductoDTO[]> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<ProductoDTO[]>(`${this.api}/productos`, { params: p });
  }

  // CU06 - consultarDisponibilidad(variante_id)
  consultarDisponibilidad(varianteId: string): Observable<DisponibilidadItem[]> {
    return this.http.get<DisponibilidadItem[]>(`${this.api}/variantes/${varianteId}/disponibilidad`);
  }

  filtrarCatalogoDict(filtros: CatalogoFiltroParams, texto?: string): Observable<ProductoDTO[]> {
    return this.consultarCatalogo({ ...filtros, texto });
  }
}
