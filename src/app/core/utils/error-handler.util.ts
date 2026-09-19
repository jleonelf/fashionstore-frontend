/**
 * Utilidad para formatear errores provenientes de la API (FastAPI / HTTP)
 * Convierte arrays de validación 422 y objetos en texto claro y amigable en español.
 */

export function formatearErrorApi(error: any, fallback = 'No se pudo completar la operación.'): string {
  if (!error) return fallback;

  const detail = error?.error?.detail ?? error?.detail ?? error?.error?.message ?? error?.message;

  if (typeof detail === 'string') {
    return traducirMensajeComun(detail);
  }

  if (Array.isArray(detail)) {
    const mensajes = detail.map((d: any) => {
      if (typeof d === 'string') return traducirMensajeComun(d);
      if (d && typeof d === 'object') {
        const campo = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : '';
        const etiquetaCampo = traducirCampo(String(campo));
        const textoMsg = traducirMensajeComun(d.msg || JSON.stringify(d));
        return etiquetaCampo ? `${etiquetaCampo}: ${textoMsg}` : textoMsg;
      }
      return String(d);
    });
    return mensajes.filter(Boolean).join('. ') || fallback;
  }

  if (detail && typeof detail === 'object') {
    if (detail.msg) return traducirMensajeComun(String(detail.msg));
    const entradas = Object.entries(detail)
      .map(([k, v]) => `${traducirCampo(k)}: ${traducirMensajeComun(String(v))}`)
      .join(', ');
    return entradas || fallback;
  }

  if (typeof error?.error === 'string') {
    return traducirMensajeComun(error.error);
  }

  return fallback;
}

function traducirCampo(campo: string): string {
  const mapa: Record<string, string> = {
    correo_electronico: 'Correo electrónico',
    contrasenia: 'Contraseña',
    nombres: 'Nombres',
    apellidos: 'Apellidos',
    fecha_visita: 'Fecha de visita',
    fecha_nacimiento: 'Fecha de nacimiento',
    telefono: 'Teléfono',
    cantidad: 'Cantidad',
    detalle_venta_id: 'Línea de venta',
    variante_id: 'Prenda / Variante',
    sucursal_id: 'Sucursal',
    causa: 'Causa documentada',
    motivo: 'Motivo',
    precio: 'Precio',
    direccion: 'Dirección'
  };
  return mapa[campo] || (campo !== 'body' ? campo : '');
}

function traducirMensajeComun(msg: string): string {
  if (!msg) return '';
  if (msg.includes('value is not a valid email address')) {
    return 'Ingresá un formato de correo válido (ejemplo: usuario@correo.com)';
  }
  if (msg.includes('String should have at least') || msg.includes('ensure this value has at least')) {
    return 'Debe tener al menos la longitud mínima requerida';
  }
  if (msg.includes('Field required') || msg.includes('field required')) {
    return 'Este campo es obligatorio';
  }
  if (msg.includes('Input should be a valid date')) {
    return 'Formato de fecha no válido';
  }
  if (msg.includes('Input should be a valid UUID')) {
    return 'Identificador no válido';
  }
  return msg;
}
