import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CiudadDTO,
  CiudadCrearDTO,
  SucursalDTO,
  SucursalCrearDTO,
  ConfigurarTarifasDeliveryDTO
} from '../models/organizacion.models';

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Listar ciudades
   */
  gestionarCiudades(soloActivas: boolean = true): Observable<CiudadDTO[]> {
    return this.http.get<CiudadDTO[]>(`${this.apiUrl}/ciudades?solo_activas=${soloActivas}`);
  }

  /**
   * Registrar nueva ciudad
   */
  registrarCiudad(nombre: string): Observable<CiudadDTO> {
    const payload: CiudadCrearDTO = { nombre };
    return this.http.post<CiudadDTO>(`${this.apiUrl}/ciudades`, payload);
  }

  /**
   * Listar sucursales con filtro opcional de ciudad
   */
  gestionarSucursales(ciudadId?: string): Observable<SucursalDTO[]> {
    let params = new HttpParams();
    if (ciudadId) params = params.set('ciudad_id', ciudadId);
    return this.http.get<SucursalDTO[]>(`${this.apiUrl}/sucursales`, { params });
  }

  /**
   * Registrar sucursal con parámetros de delivery
   */
  registrarSucursal(datos: SucursalCrearDTO): Observable<SucursalDTO> {
    return this.http.post<SucursalDTO>(`${this.apiUrl}/sucursales`, datos);
  }

  /**
   * Configurar tarifas y anillos de delivery de una sucursal
   */
  configurarTarifasDelivery(sucursalId: string, datos: ConfigurarTarifasDeliveryDTO): Observable<SucursalDTO> {
    return this.http.patch<SucursalDTO>(`${this.apiUrl}/sucursales/${sucursalId}/tarifas`, datos);
  }
}
