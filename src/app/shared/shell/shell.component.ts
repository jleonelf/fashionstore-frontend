import { Component, DestroyRef, ElementRef, HostListener, OnInit, Renderer2, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  @ViewChild('menuButton') menuButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('closeButton') closeButton?: ElementRef<HTMLButtonElement>;

  usuarioActual: ClientePerfil | null = null;
  menuAbierto = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public authService: AuthService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.authService.usuario$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((u) => {
      this.usuarioActual = u;
    });

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.cerrarMenu(false));
  }

  alternarMenu(): void {
    this.menuAbierto ? this.cerrarMenu() : this.abrirMenu();
  }

  abrirMenu(): void {
    this.menuAbierto = true;
    this.renderer.addClass(document.body, 'menu-open');
    setTimeout(() => this.closeButton?.nativeElement.focus());
  }

  cerrarMenu(devolverFoco = true): void {
    if (!this.menuAbierto) return;
    this.menuAbierto = false;
    this.renderer.removeClass(document.body, 'menu-open');
    if (devolverFoco) setTimeout(() => this.menuButton?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    if (this.menuAbierto) this.cerrarMenu();
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

  puedeVerSucursales(): boolean { return this.esAdmin(); }
  puedeVerProductos(): boolean { return this.esAdmin(); }
  puedeVerRecepciones(): boolean { return this.esAdmin(); }
  puedeVerInventario(): boolean { return ['ADMINISTRADOR','ENCARGADO','CAJERO'].includes(this.usuarioActual?.rol || ''); }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/']);
  }
}
