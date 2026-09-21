import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../core/services/dashboard.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardDTO } from '../../core/models/ciclo3.models';
import { SucursalDTO } from '../../core/models/organizacion.models';
import { formatearBs, entradaLocalIso } from '../../core/utils/moneda.util';
import { etiquetaEstado, claseEstado } from '../../core/utils/estado-mapper.util';
import { formatearErrorApi } from '../../core/utils/error-handler.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  dashboard: DashboardDTO | null = null;
  sucursales: SucursalDTO[] = [];
  sucursalFiltro = '';
  desdeFiltro = '';
  hastaFiltro = '';
  cargando = true;
  error: string | null = null;
  esAdmin = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private dashboardService: DashboardService,
    private orgService: OrganizacionService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.authService.obtenerUsuarioActual();
    this.esAdmin = u?.rol === 'ADMINISTRADOR';

    // Leer filtros iniciales desde query parameters
    const qp = this.route.snapshot.queryParamMap;
    this.desdeFiltro = qp.get('desde') ?? '';
    this.hastaFiltro = qp.get('hasta') ?? '';

    if (!this.esAdmin && u?.sucursal_id) {
      // El encargado queda estrictamente limitado a su sucursal
      this.sucursalFiltro = u.sucursal_id;
    } else {
      this.sucursalFiltro = qp.get('sucursal') ?? '';
    }

    this.orgService.gestionarSucursales().subscribe(s => this.sucursales = s);
    this.cargar();
  }

  aplicarFiltros(): void {
    // Sincronizar en query params para que se mantengan al recargar
    const queryParams: Record<string, string | null> = {
      desde: this.desdeFiltro || null,
      hasta: this.hastaFiltro || null,
    };
    if (this.esAdmin) {
      queryParams['sucursal'] = this.sucursalFiltro || null;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });

    this.cargar();
  }

  limpiarFiltros(): void {
    this.desdeFiltro = '';
    this.hastaFiltro = '';
    if (this.esAdmin) {
      this.sucursalFiltro = '';
    }
    this.aplicarFiltros();
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;

    const payload = {
      desde: entradaLocalIso(this.desdeFiltro),
      hasta: entradaLocalIso(this.hastaFiltro),
      sucursal_id: this.sucursalFiltro || undefined
    };

    this.dashboardService.consultar(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => {
          this.dashboard = d;
          this.cargando = false;
        },
        error: e => {
          this.error = formatearErrorApi(e, 'No se pudieron consultar los indicadores del dashboard.');
          this.cargando = false;
        }
      });
  }

  sucursalNombre(id: string): string {
    return this.sucursales.find(s => s.id === id)?.nombre ?? 'Sucursal local';
  }

  num(val: number | string | null | undefined): number {
    return Number(val ?? 0);
  }

  bs(m: number | string | null | undefined): string {
    return formatearBs(m);
  }

  etiqueta(estado: string): string {
    return etiquetaEstado(estado);
  }

  clase(estado: string): string {
    return claseEstado(estado);
  }

  clavesEstadosPedidos(): string[] {
    return this.dashboard?.estados_pedidos ? Object.keys(this.dashboard.estados_pedidos) : [];
  }
}
