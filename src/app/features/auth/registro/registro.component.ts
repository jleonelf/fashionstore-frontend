import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegistroClienteDTO } from '../../../core/models/auth.models';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  datosRegistro: RegistroClienteDTO = {
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    contrasenia: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion_referencia: '',
    preferencias: {}
  };

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  registrarCliente(): void {
    if (!this.datosRegistro.nombres || !this.datosRegistro.apellidos || !this.datosRegistro.correo_electronico || !this.datosRegistro.contrasenia) {
      this.mensajeError = 'Por favor complete todos los campos obligatorios (*)';
      return;
    }

    this.cargando = true;
    this.mensajeError = null;

    this.authService.registrarCliente(this.datosRegistro).subscribe({
      next: (cliente) => {
        this.cargando = false;
        this.mensajeExito = `¡Cuenta creada exitosamente para ${cliente.nombre_completo}! Redirigiendo a inicio de sesión...`;
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.detail || 'Error al procesar el registro del cliente.';
      }
    });
  }
}
