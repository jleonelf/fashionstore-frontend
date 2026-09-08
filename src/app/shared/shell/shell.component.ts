import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ClientePerfil } from '../../core/models/auth.models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent implements OnInit {
  usuarioActual: ClientePerfil | null = null;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.usuario$.subscribe((u) => {
      this.usuarioActual = u;
    });
  }

  esAdmin(): boolean {
    return this.usuarioActual?.rol === 'ADMINISTRADOR';
  }

  esEncargado(): boolean {
    return this.usuarioActual?.rol === 'ENCARGADO';
  }

  esCajero(): boolean {
    return this.usuarioActual?.rol === 'CAJERO';
  }

  esAdminOEncargado(): boolean {
    return this.usuarioActual?.rol === 'ADMINISTRADOR' || this.usuarioActual?.rol === 'ENCARGADO' || this.usuarioActual?.rol === 'CAJERO';
  }

  puedeVerSucursales(): boolean { return this.esAdmin(); }
  puedeVerProductos(): boolean { return this.esAdmin(); }
  puedeVerRecepciones(): boolean { return this.esAdmin(); }
  puedeVerInventario(): boolean { return ['ADMINISTRADOR','ENCARGADO','CAJERO'].includes(this.usuarioActual?.rol || ''); }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/']);
  }
}
