import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginDTO } from '../../../core/models/auth.models';
import { formatearErrorApi } from '../../../core/utils/error-handler.util';

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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  iniciarSesion(): void {
    const correo = this.credenciales.correo_electronico?.trim() || '';
    const clave = this.credenciales.contrasenia || '';

    if (!correo || !clave) {
      this.mensajeError = 'Por favor complete todos los campos requeridos.';
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(correo)) {
      this.mensajeError = 'Ingresá un formato de correo electrónico válido (ejemplo: usuario@correo.com).';
      return;
    }

    this.cargando = true;
    this.mensajeError = null;

    this.authService.iniciarSesion({ correo_electronico: correo.toLowerCase(), contrasenia: clave }).subscribe({
      next: (resp) => {
        this.cargando = false;
        this.mensajeExito = `¡Bienvenido, ${resp.usuario.nombre_completo}!`;
        const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl');
        this.router.navigateByUrl(redirectUrl?.startsWith('/') ? redirectUrl : '/');
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = formatearErrorApi(err, 'Credenciales inválidas o cuenta inactiva.');
      }
    });
  }
}
