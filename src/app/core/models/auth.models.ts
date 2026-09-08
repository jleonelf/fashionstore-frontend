export interface RegistroClienteDTO {
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  contrasenia: string;
  telefono?: string;
  direccion_referencia?: string;
  fecha_nacimiento?: string;
  preferencias?: Record<string, any>;
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
  rol: string;
  estado: string;
  direccion_referencia?: string;
  fecha_nacimiento?: string;
  preferencias: Record<string, any>;
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
