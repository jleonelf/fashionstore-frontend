import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { UsuarioListadoDTO, UsuarioCrearDTO, RolDTO } from '../../core/models/usuario.models';
import { SucursalDTO } from '../../core/models/organizacion.models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: UsuarioListadoDTO[] = [];
  roles: RolDTO[] = [];
  sucursales: SucursalDTO[] = [];
  
  filtroRolId = '';
  filtroEstado = '';

  nuevoUsuario: UsuarioCrearDTO = {
    rol_id: '',
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    contrasenia: '',
    telefono: '',
    sucursal_id: null,
    cargo: null
  };

  cargando = false;
  guardando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  usuarioCambioRol: UsuarioListadoDTO | null = null;
  nuevoRolId = '';
  usuarioCambioEstado: UsuarioListadoDTO | null = null;

  constructor(private usuarioService: UsuarioService, private organizacionService: OrganizacionService) {}

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarSucursales();
    this.cargarUsuarios();
  }

  sucursalesFiltradas(): SucursalDTO[] { return this.sucursales; }

  rolRequiereSucursal(): boolean {
    const rol = this.roles.find(r => r.id === this.nuevoUsuario.rol_id);
    if (!rol) return false;
    return ['ENCARGADO','CAJERO'].includes(rol.nombre.toUpperCase());
  }

  cargarRoles(): void {
    this.usuarioService.listarRoles().subscribe({
      next: (data) => (this.roles = data),
      error: () => (this.mensajeError = 'Error al cargar lista de roles.')
    });
  }

  cargarSucursales(): void {
    this.organizacionService.gestionarSucursales().subscribe({
      next: (data) => (this.sucursales = data),
      error: () => (this.sucursales = [])
    });
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.gestionarUsuarios(this.filtroRolId || undefined, this.filtroEstado || undefined).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'Error al consultar la lista de usuarios.';
        this.cargando = false;
      }
    });
  }

  crearUsuario(): void {
    if (!this.nuevoUsuario.rol_id || !this.nuevoUsuario.nombres || !this.nuevoUsuario.apellidos || !this.nuevoUsuario.correo_electronico || !this.nuevoUsuario.contrasenia) {
      this.mensajeError = 'Por favor complete todos los campos obligatorios (*)';
      return;
    }
    if (this.rolRequiereSucursal() && !this.nuevoUsuario.sucursal_id) {
      this.mensajeError = 'Para el rol ENCARGADO/CAJERO debe seleccionar la sucursal asignada.';
      return;
    }

    // preparar payload: limpiar sucursal_id si no requiere
    const payload: UsuarioCrearDTO = { ...this.nuevoUsuario };
    if (!this.rolRequiereSucursal()) {
      payload.sucursal_id = null;
      payload.cargo = null;
    }
    if (payload.sucursal_id === '') payload.sucursal_id = null;
    if (payload.cargo === '') payload.cargo = null;

    this.guardando = true;
    this.mensajeError = null;

    this.usuarioService.crearUsuario(payload).subscribe({
      next: (u) => {
        this.guardando = false;
        const sucInfo = u.sucursal_nombre ? ` → ${u.sucursal_nombre}` : '';
        this.mensajeExito = `Usuario ${u.nombre_completo} registrado exitosamente con rol ${u.rol_nombre}${sucInfo}.`;
        this.nuevoUsuario = {
          rol_id: '',
          nombres: '',
          apellidos: '',
          correo_electronico: '',
          contrasenia: '',
          telefono: '',
          sucursal_id: null,
          cargo: null
        };
        this.cargarUsuarios();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err.error?.detail || JSON.stringify(err.error) || 'Error al crear usuario.';
      }
    });
  }

  cambiarRol(usuario: UsuarioListadoDTO): void {
    this.usuarioCambioRol = usuario;
    this.nuevoRolId = usuario.rol_id;
  }

  cerrarCambioRol(): void {
    this.usuarioCambioRol = null;
    this.nuevoRolId = '';
  }

  confirmarCambioRol(): void {
    if (!this.usuarioCambioRol || !this.nuevoRolId) return;
    this.guardando = true;
    this.usuarioService.asignarRol(this.usuarioCambioRol.id, this.nuevoRolId).subscribe({
      next: (u) => {
        this.guardando = false;
        this.mensajeExito = `Rol de ${u.nombre_completo} actualizado a ${u.rol_nombre}.`;
        this.cerrarCambioRol();
        this.cargarUsuarios();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err.error?.detail || 'Error al cambiar rol.';
      }
    });
  }

  alternarEstado(usuario: UsuarioListadoDTO): void {
    this.usuarioCambioEstado = usuario;
  }

  cerrarCambioEstado(): void {
    this.usuarioCambioEstado = null;
  }

  confirmarCambioEstado(): void {
    if (!this.usuarioCambioEstado) return;
    const usuario = this.usuarioCambioEstado;
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.guardando = true;
    this.usuarioService.actualizarEstadoUsuario(usuario.id, nuevoEstado).subscribe({
      next: (u) => {
        this.guardando = false;
        this.mensajeExito = `Estado de ${u.nombre_completo} cambiado a ${u.estado}.`;
        this.cerrarCambioEstado();
        this.cargarUsuarios();
      },
      error: () => {
        this.guardando = false;
        this.mensajeError = 'Error al actualizar estado del usuario.';
      }
    });
  }
}
