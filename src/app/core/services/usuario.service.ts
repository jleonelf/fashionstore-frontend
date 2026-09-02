import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UsuarioCrearDTO,
  UsuarioListadoDTO,
  AsignarRolDTO,
  ActualizarEstadoDTO,
  RolDTO
} from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * CU02 / RF02: Listar usuarios con filtros opcionales
   */
  gestionarUsuarios(rolId?: string, estado?: string): Observable<UsuarioListadoDTO[]> {
    let params = new HttpParams();
    if (rolId) params = params.set('rol_id', rolId);
    if (estado) params = params.set('estado', estado);
    return this.http.get<UsuarioListadoDTO[]>(`${this.apiUrl}/usuarios`, { params });
  }

  /**
   * CU02 / RF02: Crear usuario con rol único
   */
  crearUsuario(datos: UsuarioCrearDTO): Observable<UsuarioListadoDTO> {
    return this.http.post<UsuarioListadoDTO>(`${this.apiUrl}/usuarios`, datos);
  }

  /**
   * CU02 / RF02: Asignar o cambiar rol único de un usuario
   */
  asignarRol(usuarioId: string, rolId: string): Observable<UsuarioListadoDTO> {
    const payload: AsignarRolDTO = { rol_id: rolId };
    return this.http.patch<UsuarioListadoDTO>(`${this.apiUrl}/usuarios/${usuarioId}/rol`, payload);
  }

  /**
   * CU02 / RF02: Desactivar usuario
   */
  desactivarUsuario(usuarioId: string): Observable<UsuarioListadoDTO> {
    return this.http.patch<UsuarioListadoDTO>(`${this.apiUrl}/usuarios/${usuarioId}/desactivar`, {});
  }

  /**
   * CU02 / RF02: Actualizar estado de usuario
   */
  actualizarEstadoUsuario(usuarioId: string, estado: 'ACTIVO' | 'INACTIVO'): Observable<UsuarioListadoDTO> {
    const payload: ActualizarEstadoDTO = { estado };
    return this.http.patch<UsuarioListadoDTO>(`${this.apiUrl}/usuarios/${usuarioId}/estado`, payload);
  }

  /**
   * CU02 / RF02: Listar roles activos
   */
  listarRoles(): Observable<RolDTO[]> {
    return this.http.get<RolDTO[]>(`${this.apiUrl}/roles`);
  }
}
