import { Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IAService } from '../../core/services/ia.service';
import { ReporteRespuestaDTO, DecisionRespuestaDTO, DecisionItemDTO } from '../../core/models/ciclo3.models';
import { formatearBs, type DecimalApi } from '../../core/utils/moneda.util';
import { etiquetaEstado, claseEstado } from '../../core/utils/estado-mapper.util';
import { formatearErrorApi } from '../../core/utils/error-handler.util';
import { RadialProgressComponent } from '../../shared/data-viz/radial-progress/radial-progress.component';
import { HorizontalBarsComponent, HorizontalBarItem } from '../../shared/data-viz/horizontal-bars/horizontal-bars.component';
import { SegmentedBarComponent, SegmentoItem } from '../../shared/data-viz/segmented-bar/segmented-bar.component';

export interface InventarioSucursalReporteVM {
  sucursal: string;
  variantes: number;
  disponible: number;
  reservado: number;
  en_transito: number;
  segmentos: SegmentoItem[];
}

export interface RotacionFilaVM {
  varianteId: string;
  etiquetaLegible: string;
  stock: number;
  ventas: number;
  stockPct: number;
  ventasPct: number;
}

export interface DecisionItemVM extends DecisionItemDTO {
  stockPct: number;
  ventasPct: number;
}

@Component({
  selector: 'app-inteligencia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RadialProgressComponent,
    HorizontalBarsComponent,
    SegmentedBarComponent
  ],
  templateUrl: './inteligencia.component.html',
  styleUrls: ['./inteligencia.component.css']
})
export class InteligenciaComponent implements OnDestroy {
  activeTab: 'reportes' | 'decisiones' = 'reportes';

  // Reportes
  consulta = '';
  reporte: ReporteRespuestaDTO | null = null;
  generando = false;
  errorReporte: string | null = null;

  // Secuencia de carga textual intencional
  readonly pasosCarga = [
    'Interpretando consulta',
    'Consultando datos autorizados',
    'Preparando lectura del negocio'
  ];
  pasoCargaActual = 0;
  private intervaloCarga: any = null;

  // Decisiones
  diasVentana = 30;
  umbralRotacion = 5;
  decisiones: DecisionRespuestaDTO | null = null;
  consultando = false;
  errorDecision: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private iaService: IAService) {}

  ngOnDestroy(): void {
    this.limpiarIntervaloCarga();
  }

  get tituloReporte(): string {
    const titulos: Record<string, string> = {
      ventasPorSucursal: 'Ventas por sucursal',
      inventarioPorSucursal: 'Inventario por sucursal',
      ventasPorTemporada: 'Ventas por temporada',
      stockCritico: 'Stock crítico',
      topVendidos: 'Productos más vendidos',
      efectividadReservas: 'Efectividad de reservas',
      rotacionPorTemporada: 'Rotación de inventario'
    };
    return this.reporte ? (titulos[this.reporte.funcion_usada] ?? 'Reporte de analítica') : '';
  }

  get nombreProveedor(): string {
    if (!this.reporte?.proveedor) return 'Motor analítico seguro';
    return this.reporte.proveedor === 'GEMINI' ? 'Gemini analítico' : 'Motor determinista local';
  }

  // --- View Models para cada una de las 7 funciones reales ---

  get ventasPorSucursalBarsVM(): HorizontalBarItem[] {
    const filas = this.reporte?.datos['por_sucursal'];
    if (!Array.isArray(filas)) return [];
    return filas.filter(this.esRegistro).map(fila => ({
      etiqueta: String(fila['sucursal'] ?? 'Sucursal'),
      valor: Number(fila['ingresos'] ?? 0),
      valorFormateado: this.bs(fila['ingresos'] as DecimalApi),
      subtitulo: `${fila['ventas'] ?? 0} ventas confirmadas`
    }));
  }

  get inventarioPorSucursalVM(): InventarioSucursalReporteVM[] {
    const filas = this.reporte?.datos['inventario_por_sucursal'];
    if (!Array.isArray(filas)) return [];
    return filas.filter(this.esRegistro).map(fila => {
      const sucursal = String(fila['sucursal'] ?? 'Sucursal');
      const variantes = Number(fila['variantes'] ?? 0);
      const disponible = Number(fila['disponible'] ?? 0);
      const reservado = Number(fila['reservado'] ?? 0);
      const en_transito = Number(fila['en_transito'] ?? 0);

      const segmentos: SegmentoItem[] = [
        { etiqueta: 'Disponible', valor: disponible, colorClase: 'color-success' },
        { etiqueta: 'Reservado', valor: reservado, colorClase: 'color-brass' },
        { etiqueta: 'En tránsito', valor: en_transito, colorClase: 'color-warning' }
      ];

      return {
        sucursal,
        variantes,
        disponible,
        reservado,
        en_transito,
        segmentos
      };
    });
  }

  get temporadasVM(): string[] {
    const temps = this.reporte?.datos['temporadas'];
    return Array.isArray(temps) ? temps.map(String) : [];
  }

  get stockCriticoBarsVM(): HorizontalBarItem[] {
    const filas = this.reporte?.datos['criticos'];
    if (!Array.isArray(filas)) return [];
    return filas.filter(this.esRegistro).map(fila => {
      const disp = Number(fila['disponible'] ?? 0);
      let nivel: 'urgente' | 'critico' | 'normal' = 'normal';
      let valorFormateado = `${disp} un.`;
      if (disp <= 0) {
        nivel = 'urgente';
        valorFormateado = '0 un. (Agotado)';
      } else if (disp <= 2) {
        nivel = 'critico';
        valorFormateado = `${disp} un. (Crítico)`;
      }

      return {
        etiqueta: String(fila['sku'] ?? 'SKU'),
        valor: disp,
        valorFormateado,
        nivel
      };
    });
  }

  get topVendidosBarsVM(): HorizontalBarItem[] {
    const filas = this.reporte?.datos['top'];
    if (!Array.isArray(filas)) return [];
    return filas.filter(this.esRegistro).map(fila => ({
      etiqueta: String(fila['sku'] ?? 'SKU'),
      valor: Number(fila['unidades'] ?? 0),
      valorFormateado: `${fila['unidades'] ?? 0} un.`
    }));
  }

  get reservasReporteVM(): { total: number; completadas: number; conversionPct: number } {
    const d = this.reporte?.datos ?? {};
    const total = Number(d['total'] ?? 0);
    const completadas = Number(d['completadas'] ?? 0);
    const conversion = Number(d['conversion'] ?? 0);
    return {
      total,
      completadas,
      conversionPct: Math.round(conversion * 1000) / 10
    };
  }

  get rotacionFilasVM(): { ventanaDias: number; filas: RotacionFilaVM[] } {
    const d = this.reporte?.datos ?? {};
    const ventanaDias = Number(d['ventana_dias'] ?? 30);
    const filas = Array.isArray(d['filas']) ? d['filas'].filter(this.esRegistro) : [];

    const vmFilas: RotacionFilaVM[] = filas.map((fila, i) => {
      const vid = String(fila['variante_id'] ?? '');
      const stock = Number(fila['stock'] ?? 0);
      const ventas = Number(fila['ventas'] ?? 0);
      const max = Math.max(stock, ventas, 1);
      return {
        varianteId: vid,
        etiquetaLegible: `Ítem de catálogo #${i + 1} (${vid.slice(0, 8)})`,
        stock,
        ventas,
        stockPct: Math.min(100, Math.round((stock / max) * 100)),
        ventasPct: Math.min(100, Math.round((ventas / max) * 100))
      };
    });

    return { ventanaDias, filas: vmFilas };
  }

  get esFuncionDesconocida(): boolean {
    if (!this.reporte) return false;
    const conocidas = [
      'ventasPorSucursal',
      'inventarioPorSucursal',
      'ventasPorTemporada',
      'stockCritico',
      'topVendidos',
      'efectividadReservas',
      'rotacionPorTemporada'
    ];
    return !conocidas.includes(this.reporte.funcion_usada);
  }

  get reporteVacio(): boolean {
    if (!this.reporte?.datos) return true;
    const d = this.reporte.datos;
    if (d['total'] === 0) return true;
    if (Array.isArray(d['por_sucursal']) && d['por_sucursal'].length === 0) return true;
    if (Array.isArray(d['inventario_por_sucursal']) && d['inventario_por_sucursal'].length === 0) return true;
    if (Array.isArray(d['temporadas']) && d['temporadas'].length === 0) return true;
    if (Array.isArray(d['criticos']) && d['criticos'].length === 0) return true;
    if (Array.isArray(d['top']) && d['top'].length === 0) return true;
    if (Array.isArray(d['filas']) && d['filas'].length === 0) return true;
    return false;
  }

  get decisionesVM(): DecisionItemVM[] {
    if (!this.decisiones?.items) return [];
    return this.decisiones.items.map(d => {
      const max = Math.max(d.stock_total, d.ventas_periodo, 1);
      return {
        ...d,
        stockPct: Math.min(100, Math.round((d.stock_total / max) * 100)),
        ventasPct: Math.min(100, Math.round((d.ventas_periodo / max) * 100))
      };
    });
  }

  generarReporte(): void {
    if (!this.consulta.trim() || this.generando) return;
    this.generando = true;
    this.errorReporte = null;
    this.reporte = null;
    this.iniciarSecuenciaCarga();

    this.iaService.generarReporte(this.consulta.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.reporte = r;
          this.generando = false;
          this.limpiarIntervaloCarga();
        },
        error: e => {
          this.errorReporte = formatearErrorApi(e, 'No se pudo generar el reporte.');
          this.generando = false;
          this.limpiarIntervaloCarga();
        }
      });
  }

  consultarDecisiones(): void {
    if (this.consultando) return;
    this.consultando = true;
    this.errorDecision = null;
    this.decisiones = null;

    this.iaService.decisionesInventario({ dias_ventana: this.diasVentana, umbral_rotacion: this.umbralRotacion })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => {
          this.decisiones = d;
          this.consultando = false;
        },
        error: e => {
          this.errorDecision = formatearErrorApi(e, 'No se pudieron obtener decisiones.');
          this.consultando = false;
        }
      });
  }

  private iniciarSecuenciaCarga(): void {
    this.limpiarIntervaloCarga();
    this.pasoCargaActual = 0;
    this.intervaloCarga = setInterval(() => {
      if (this.pasoCargaActual < this.pasosCarga.length - 1) {
        this.pasoCargaActual++;
      }
    }, 1100);
  }

  private limpiarIntervaloCarga(): void {
    if (this.intervaloCarga) {
      clearInterval(this.intervaloCarga);
      this.intervaloCarga = null;
    }
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }

  accionIcono(accion: string): string {
    const m: Record<string, string> = {
      PROMOCION: '🏷️',
      LIQUIDACION: '📉',
      TRASLADO: '🚚',
      REPOSICION: '📦',
      MANTENER: '✓'
    };
    return m[accion] ?? '•';
  }

  etiqueta(e: string): string { return etiquetaEstado(e); }
  clase(e: string): string { return claseEstado(e); }
  bs(m: DecimalApi | null | undefined): string { return formatearBs(m); }
}
