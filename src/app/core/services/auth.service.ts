import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegistroClienteDTO, LoginDTO, ClientePerfil, TokenRespuesta } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}`;
  private usuarioSubject = new BehaviorSubject<ClientePerfil | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarSesionAlmacenada();
  }

  /**
   * CU01 / RF01: Registro de nuevo cliente
   */
  registrarCliente(datos: RegistroClienteDTO): Observable<ClientePerfil> {
    return this.http.post<ClientePerfil>(`${this.apiUrl}/clientes`, datos);
  }

  /**
   * CU01 / RF01: Iniciar sesión y guardar token JWT
   */
  iniciarSesion(credenciales: LoginDTO): Observable<TokenRespuesta> {
    return this.http.post<TokenRespuesta>(`${this.apiUrl}/sesion`, credenciales).pipe(
      tap((respuesta) => {
        if (respuesta && respuesta.access_token) {
          localStorage.setItem('fs_token', respuesta.access_token);
          localStorage.setItem('fs_usuario', JSON.stringify(respuesta.usuario));
          this.usuarioSubject.next(respuesta.usuario);
        }
      })
    );
  }

  /**
   * Cerrar sesión y limpiar almacenamiento local
   */
  cerrarSesion(): void {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_usuario');
    this.usuarioSubject.next(null);
  }

  /**
   * Obtener token JWT actual
   */
  obtenerToken(): string | null {
    return localStorage.getItem('fs_token');
  }

  /**
   * Verifica si existe un usuario autenticado
   */
  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  /**
   * Obtener el perfil del usuario autenticado
   */
  obtenerUsuarioActual(): ClientePerfil | null {
    return this.usuarioSubject.value;
  }

  get usuarioActualValue(): ClientePerfil | null {
    return this.usuarioSubject.value;
  }

  private cargarSesionAlmacenada(): void {
    const usuarioGuardado = localStorage.getItem('fs_usuario');
    if (usuarioGuardado) {
      try {
        this.usuarioSubject.next(JSON.parse(usuarioGuardado));
      } catch (e) {
        this.cerrarSesion();
      }
    }
  }
}
