import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  Renderer2,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { CarritoService } from '../../core/services/carrito.service';
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
  @ViewChild('mobileDrawer') mobileDrawer?: ElementRef<HTMLElement>;

  usuarioActual: ClientePerfil | null = null;
  menuAbierto = false;
  conteoCarrito = 0;
  dropdownActivo: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public authService: AuthService,
    public carritoService: CarritoService,
    private router: Router,
    private renderer: Renderer2,
    private hostEl: ElementRef
  ) {}

  ngOnInit(): void {
    this.authService.usuario$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((u) => {
      this.usuarioActual = u;
      if (u?.rol === 'CLIENTE') {
        this.carritoService.refrescarConteo();
      }
    });

    this.carritoService.conteo$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((c: number) => {
      this.conteoCarrito = c;
    });

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.cerrarMenu(false);
      this.cerrarDropdowns();
    });
  }

  alternarMenu(): void {
    this.menuAbierto ? this.cerrarMenu() : this.abrirMenu();
  }

  abrirMenu(): void {
    this.menuAbierto = true;
    this.renderer.addClass(document.body, 'menu-open');
    setTimeout(() => this.closeButton?.nativeElement.focus(), 50);
  }

  cerrarMenu(devolverFoco = true): void {
    if (!this.menuAbierto) return;
    this.menuAbierto = false;
    this.renderer.removeClass(document.body, 'menu-open');
    if (devolverFoco) setTimeout(() => this.menuButton?.nativeElement.focus(), 50);
  }

  toggleDropdown(id: string, event?: Event): void {
    event?.stopPropagation();
    this.dropdownActivo = this.dropdownActivo === id ? null : id;
  }

  abrirDropdown(id: string): void {
    this.dropdownActivo = id;
  }

  cerrarDropdowns(): void {
    this.dropdownActivo = null;
  }

  @HostListener('document:click', ['$event'])
  alHacerClickDocumento(event: MouseEvent): void {
    if (this.dropdownActivo && !this.hostEl.nativeElement.contains(event.target)) {
      this.cerrarDropdowns();
    }
  }

  @HostListener('document:keydown', ['$event'])
  alPresionarTecla(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.menuAbierto) {
        this.cerrarMenu();
      } else if (this.dropdownActivo) {
        this.cerrarDropdowns();
      }
    } else if (event.key === 'Tab' && this.menuAbierto && this.mobileDrawer) {
      this.gestionarFocoDrawer(event);
    }
  }

  private gestionarFocoDrawer(event: KeyboardEvent): void {
    const elementos = this.mobileDrawer?.nativeElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!elementos || elementos.length === 0) return;

    const primerElemento = elementos[0];
    const ultimoElemento = elementos[elementos.length - 1];

    if (event.shiftKey && document.activeElement === primerElemento) {
      event.preventDefault();
      ultimoElemento.focus();
    } else if (!event.shiftKey && document.activeElement === ultimoElemento) {
      event.preventDefault();
      primerElemento.focus();
    }
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

  esCliente(): boolean {
    return this.usuarioActual?.rol === 'CLIENTE';
  }

  puedeVerCarrito(): boolean { return this.esCliente(); }
  puedeVerMisPedidos(): boolean { return this.esCliente(); }
  puedeVerPedidos(): boolean { return ['ADMINISTRADOR','ENCARGADO','CAJERO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerPromociones(): boolean { return ['ADMINISTRADOR','ENCARGADO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerDashboard(): boolean { return ['ADMINISTRADOR','ENCARGADO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerInteligencia(): boolean { return ['ADMINISTRADOR','ENCARGADO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerSucursales(): boolean { return this.esAdmin(); }
  puedeVerProductos(): boolean { return this.esAdmin(); }
  puedeVerRecepciones(): boolean { return this.esAdmin(); }
  puedeVerInventario(): boolean { return ['ADMINISTRADOR','ENCARGADO','CAJERO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerReservas(): boolean { return ['CLIENTE', 'ADMINISTRADOR', 'ENCARGADO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerTraslados(): boolean { return ['ADMINISTRADOR','ENCARGADO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerCaja(): boolean { return ['ADMINISTRADOR','CAJERO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerOperaciones(): boolean { return ['ADMINISTRADOR','ENCARGADO'].includes(this.usuarioActual?.rol || ''); }
  puedeVerHistorial(): boolean { return this.usuarioActual?.rol === 'CLIENTE'; }

  cerrarSesion(): void {
    this.cerrarDropdowns();
    this.authService.cerrarSesion();
    this.router.navigate(['/']);
  }
}
