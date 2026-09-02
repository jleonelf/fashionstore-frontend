import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginDTO } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  formulario: LoginDTO = {
    correo_electronico: '',
    contrasenia: ''
  };

  cargando = false;
  mensajeError: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarSesion(): void {
    this.mensajeError = null;

    if (!this.formulario.correo_electronico || !this.formulario.contrasenia) {
      this.mensajeError = 'Por favor ingrese su correo electrónico y contraseña.';
      return;
    }

    this.cargando = true;
    this.authService.iniciarSesion(this.formulario).subscribe({
      next: (resp) => {
        this.cargando = false;
        // Redirigir según el rol del usuario
        if (resp.usuario.rol === 'ADMINISTRADOR' || resp.usuario.rol === 'Administrador') {
          this.router.navigate(['/admin/dashboard']);
        } else if (resp.usuario.rol === 'ENCARGADO' || resp.usuario.rol === 'Encargado') {
          this.router.navigate(['/sucursal/reservas']);
        } else if (resp.usuario.rol === 'CAJERO' || resp.usuario.rol === 'Cajero') {
          this.router.navigate(['/caja/ventas']);
        } else {
          this.router.navigate(['/catalogo']);
        }
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 401) {
          this.mensajeError = 'Credenciales inválidas. Verifique su correo o contraseña.';
        } else if (err.status === 403) {
          this.mensajeError = 'Su cuenta está inactiva. Contacte al administrador.';
        } else {
          this.mensajeError = 'Error de conexión con el servidor. Intente nuevamente.';
        }
      }
    });
  }
}
