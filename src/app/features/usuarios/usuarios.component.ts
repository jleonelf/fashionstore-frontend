import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioListadoDTO, UsuarioCrearDTO, RolDTO } from '../../core/models/usuario.models';

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
  
  filtroRolId = '';
  filtroEstado = '';

  nuevoUsuario: UsuarioCrearDTO = {
    rol_id: '',
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    contrasenia: '',
    telefono: ''
  };

  cargando = false;
  guardando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarUsuarios();
  }

  cargarRoles(): void {
    this.usuarioService.listarRoles().subscribe({
      next: (data) => (this.roles = data),
      error: () => (this.mensajeError = 'Error al cargar lista de roles.')
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

    this.guardando = true;
    this.mensajeError = null;

    this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
      next: (u) => {
        this.guardando = false;
        this.mensajeExito = `Usuario ${u.nombre_completo} registrado exitosamente con rol ${u.rol_nombre}.`;
        this.nuevoUsuario = {
          rol_id: '',
          nombres: '',
          apellidos: '',
          correo_electronico: '',
          contrasenia: '',
          telefono: ''
        };
        this.cargarUsuarios();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err.error?.detail || 'Error al crear usuario.';
      }
    });
  }

  cambiarRol(usuario: UsuarioListadoDTO): void {
    const rolActual = this.roles.find(r => r.id === usuario.rol_id)?.nombre;
    const nombresRoles = this.roles.map(r => r.nombre).join(', ');
    const nuevoNombre = prompt(`Cambiar rol de ${usuario.nombre_completo} (Actual: ${rolActual}).\nRoles válidos: ${nombresRoles}\n\nIngresa el nombre del nuevo rol:`);

    if (!nuevoNombre) return;

    const rolDestino = this.roles.find(r => r.nombre.toUpperCase() === nuevoNombre.trim().toUpperCase());
    if (!rolDestino) {
      alert('Rol no válido.');
      return;
    }

    this.usuarioService.asignarRol(usuario.id, rolDestino.id).subscribe({
      next: (u) => {
        this.mensajeExito = `Rol de ${u.nombre_completo} actualizado a ${u.rol_nombre}.`;
        this.cargarUsuarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.detail || 'Error al cambiar rol.';
      }
    });
  }

  alternarEstado(usuario: UsuarioListadoDTO): void {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.usuarioService.actualizarEstadoUsuario(usuario.id, nuevoEstado).subscribe({
      next: (u) => {
        this.mensajeExito = `Estado de ${u.nombre_completo} cambiado a ${u.estado}.`;
        this.cargarUsuarios();
      },
      error: () => {
        this.mensajeError = 'Error al actualizar estado del usuario.';
      }
    });
  }
}
