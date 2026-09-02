import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RegistroClienteDTO } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-cliente.component.html',
  styleUrls: ['./registro-cliente.component.css']
})
export class RegistroClienteComponent {
  formulario: RegistroClienteDTO = {
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    contrasenia: '',
    telefono: '',
    direccion_referencia: '',
    fecha_nacimiento: ''
  };

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  registrarCliente(): void {
    this.mensajeError = null;
    this.mensajeExito = null;

    if (!this.formulario.nombres || !this.formulario.apellidos || !this.formulario.correo_electronico || !this.formulario.contrasenia) {
      this.mensajeError = 'Por favor complete todos los campos obligatorios.';
      return;
    }

    if (this.formulario.contrasenia.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;
    this.authService.registrarCliente(this.formulario).subscribe({
      next: (cliente) => {
        this.cargando = false;
        this.mensajeExito = `¡Cuenta creada exitosamente para ${cliente.nombre_completo}! Redirigiendo al inicio de sesión...`;
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 409) {
          this.mensajeError = err.error?.detail || 'El correo electrónico ya está registrado.';
        } else {
          this.mensajeError = 'Ocurrió un error al procesar el registro. Intente nuevamente.';
        }
      }
    });
  }
}
