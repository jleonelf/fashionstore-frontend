import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IAService } from '../../core/services/ia.service';
import { ReporteRespuestaDTO, DecisionRespuestaDTO, DecisionItemDTO } from '../../core/models/ciclo3.models';
import { formatearBs, type DecimalApi } from '../../core/utils/moneda.util';
import { etiquetaEstado, claseEstado } from '../../core/utils/estado-mapper.util';
import { formatearErrorApi } from '../../core/utils/error-handler.util';

@Component({
  selector: 'app-inteligencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inteligencia.component.html',
  styleUrls: ['./inteligencia.component.css']
})
export class InteligenciaComponent {
  activeTab: 'reportes' | 'decisiones' = 'reportes';

  // Reportes
  consulta = '';
  reporte: ReporteRespuestaDTO | null = null;
  generando = false;
  errorReporte: string | null = null;

  // Decisiones
  diasVentana = 30;
  umbralRotacion = 5;
  decisiones: DecisionRespuestaDTO | null = null;
  consultando = false;
  errorDecision: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private iaService: IAService) {}

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
    return this.reporte ? (titulos[this.reporte.funcion_usada] ?? 'Reporte del negocio') : '';
  }

  get filasInventario(): Array<Record<string, unknown>> {
    const filas = this.reporte?.datos['inventario_por_sucursal'];
    return Array.isArray(filas) ? filas.filter(this.esRegistro) : [];
  }

  get filasVentas(): Array<Record<string, unknown>> {
    const filas = this.reporte?.datos['por_sucursal'];
    return Array.isArray(filas) ? filas.filter(this.esRegistro) : [];
  }

  get reporteVacio(): boolean {
    return this.reporte?.datos['total'] === 0;
  }

  valorTexto(fila: Record<string, unknown>, campo: string): string {
    const valor = fila[campo];
    return valor === null || valor === undefined ? '0' : String(valor);
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }

  generarReporte(): void {
    if (!this.consulta.trim() || this.generando) return;
    this.generando = true; this.errorReporte = null; this.reporte = null;
    this.iaService.generarReporte(this.consulta.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => { this.reporte = r; this.generando = false; },
        error: e => { this.errorReporte = formatearErrorApi(e, 'No se pudo generar el reporte.'); this.generando = false; }
      });
  }

  consultarDecisiones(): void {
    if (this.consultando) return;
    this.consultando = true; this.errorDecision = null; this.decisiones = null;
    this.iaService.decisionesInventario({ dias_ventana: this.diasVentana, umbral_rotacion: this.umbralRotacion })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.decisiones = d; this.consultando = false; },
        error: e => { this.errorDecision = formatearErrorApi(e, 'No se pudieron obtener decisiones.'); this.consultando = false; }
      });
  }

  accionIcono(accion: string): string {
    const m: Record<string, string> = { PROMOCION: '🏷️', LIQUIDACION: '📉', TRASLADO: '🚚', REPOSICION: '📦', MANTENER: '✓' };
    return m[accion] ?? '•';
  }

  etiqueta(e: string): string { return etiquetaEstado(e); }
  clase(e: string): string { return claseEstado(e); }
  bs(m: DecimalApi | null | undefined): string { return formatearBs(m); }
}
