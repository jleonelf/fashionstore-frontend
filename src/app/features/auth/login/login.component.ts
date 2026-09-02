import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginDTO } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credenciales: LoginDTO = {
    correo_electronico: '',
    contrasenia: ''
  };

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarSesion(): void {
    if (!this.credenciales.correo_electronico || !this.credenciales.contrasenia) {
      this.mensajeError = 'Por favor complete todos los campos.';
      return;
    }

    this.cargando = true;
    this.mensajeError = null;

    this.authService.iniciarSesion(this.credenciales).subscribe({
      next: (resp) => {
        this.cargando = false;
        this.mensajeExito = `¡Bienvenido ${resp.usuario.nombre_completo}! Redirigiendo...`;
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1200);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.detail || 'Credenciales inválidas o cuenta inactiva.';
      }
    });
  }
}
