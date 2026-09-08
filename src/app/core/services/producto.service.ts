import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductoDTO, VarianteDTO } from '../models/catalogo.models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // CU05 - gestionarProductos() / gestionarVariantes()
  gestionarProductos(): Observable<ProductoDTO[]> { return this.http.get<ProductoDTO[]>(`${this.api}/productos`); }
  crearProducto(dto: any): Observable<ProductoDTO> { return this.http.post<ProductoDTO>(`${this.api}/productos`, dto); }
  actualizarProducto(id: string, dto: any): Observable<ProductoDTO> { return this.http.put<ProductoDTO>(`${this.api}/productos/${id}`, dto); }
  obtenerProducto(id: string): Observable<ProductoDTO> { return this.http.get<ProductoDTO>(`${this.api}/productos/${id}`); }

  gestionarVariantes(productoId?: string): Observable<VarianteDTO[]> {
    let p = new HttpParams();
    if (productoId) p = p.set('producto_id', productoId);
    return this.http.get<VarianteDTO[]>(`${this.api}/variantes`, { params: p });
  }
  crearVariante(dto: any): Observable<VarianteDTO> { return this.http.post<VarianteDTO>(`${this.api}/variantes`, dto); }
  actualizarVariante(id: string, dto: any): Observable<VarianteDTO> { return this.http.patch<VarianteDTO>(`${this.api}/variantes/${id}`, dto); }
}
