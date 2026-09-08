import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../core/services/catalogo.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ProductoDTO } from '../../core/models/catalogo.models';
import { SucursalDTO } from '../../core/models/organizacion.models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  productos: ProductoDTO[] = [];
  sucursales: SucursalDTO[] = [];
  cargando = true;
  error: string | null = null;

  // delivery calc
  anilloDestino = 4;
  tarifaBase = 15;
  incrementoAnillo = 3;
  sucursalDemo: SucursalDTO | null = null;

  // newsletter
  emailOferta = '';
  mensajeOferta: string | null = null;

  constructor(
    private catalogoService: CatalogoService,
    private orgService: OrganizacionService
  ) {}

  ngOnInit(): void {
    this.catalogoService.consultarCatalogo({}).subscribe({
      next: (d) => {
        this.productos = d.slice(0, 12);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el catálogo — verifica que la API esté corriendo.';
        this.cargando = false;
      }
    });
    this.orgService.gestionarSucursales().subscribe({
      next: (s) => {
        this.sucursales = s;
        if (s.length) {
          this.sucursalDemo = s[0];
          this.tarifaBase = s[0].tarifa_base_delivery ?? 15;
          this.incrementoAnillo = s[0].incremento_anillo_delivery ?? 3;
        }
      },
      error: () => {}
    });
  }

  get costoDelivery(): number {
    if (!this.sucursalDemo) return this.tarifaBase + Math.max(0, this.anilloDestino - 1) * this.incrementoAnillo;
    const base = this.sucursalDemo.tarifa_base_delivery;
    const inc = this.sucursalDemo.incremento_anillo_delivery;
    const anilloOrigen = this.sucursalDemo.numero_anillo ?? 1;
    const diff = Math.abs(this.anilloDestino - anilloOrigen);
    return base + diff * inc;
  }

  imagenProducto(p: ProductoDTO): string {
    if (p.imagenes && p.imagenes.length) return p.imagenes[0].enlace_imagen;
    return 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=60';
  }

  scrollRail(dir: number): void {
    const el = document.getElementById('riel');
    if (el) el.scrollBy({ left: dir * 360, behavior: 'smooth' });
  }

  suscribir(): void {
    if (!this.emailOferta || !this.emailOferta.includes('@')) {
      this.mensajeOferta = 'Ingresa un correo válido.';
      return;
    }
    this.mensajeOferta = '¡Listo! Te enviaremos pre-lanzamientos y reservas prioritarias.';
    this.emailOferta = '';
    setTimeout(() => (this.mensajeOferta = null), 4000);
  }
}
