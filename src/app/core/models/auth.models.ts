export type RolUsuario = 'CLIENTE' | 'CAJERO' | 'ENCARGADO' | 'ADMINISTRADOR';

export interface RegistroClienteDTO {
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  contrasenia: string;
  telefono?: string;
  direccion_referencia?: string;
  fecha_nacimiento?: string;
  preferencias?: Record<string, unknown>;
}

export interface LoginDTO {
  correo_electronico: string;
  contrasenia: string;
}

export interface ClientePerfil {
  id: string;
  usuario_id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  correo_electronico: string;
  telefono?: string;
  rol: RolUsuario;
  estado: string;
  direccion_referencia?: string;
  fecha_nacimiento?: string;
  preferencias: Record<string, unknown>;
  creado_en: string;
  sucursal_id?: string | null;
  sucursal_nombre?: string | null;
  cargo?: string | null;
}

export interface TokenRespuesta {
  access_token: string;
  token_type: string;
  usuario: ClientePerfil;
}
