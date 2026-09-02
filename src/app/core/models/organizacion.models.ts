export interface CiudadDTO {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface CiudadCrearDTO {
  nombre: string;
}

export interface SucursalCrearDTO {
  ciudad_id: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  numero_anillo?: number;
  tarifa_base_delivery: number;
  incremento_anillo_delivery: number;
  anillo_minimo_delivery: number;
  anillo_maximo_delivery: number;
  delivery_activo: boolean;
}

export interface ConfigurarTarifasDeliveryDTO {
  tarifa_base_delivery: number;
  incremento_anillo_delivery: number;
  anillo_minimo_delivery?: number;
  anillo_maximo_delivery?: number;
  delivery_activo?: boolean;
}

export interface SucursalDTO {
  id: string;
  ciudad_id: string;
  ciudad_nombre?: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  numero_anillo?: number;
  tarifa_base_delivery: number;
  incremento_anillo_delivery: number;
  anillo_minimo_delivery: number;
  anillo_maximo_delivery: number;
  delivery_activo: boolean;
  activa: boolean;
}
