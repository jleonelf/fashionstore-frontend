import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InteligenciaComponent } from './inteligencia.component';
import { IAService } from '../../core/services/ia.service';
import { ReporteRespuestaDTO, DecisionRespuestaDTO } from '../../core/models/ciclo3.models';

describe('InteligenciaComponent (Visualizaciones de IA y decisiones de inventario)', () => {
  let fixture: ComponentFixture<InteligenciaComponent>;
  let component: InteligenciaComponent;
  let iaSpy: jasmine.SpyObj<IAService>;

  beforeEach(async () => {
    iaSpy = jasmine.createSpyObj<IAService>('IAService', ['generarReporte', 'decisionesInventario']);
    await TestBed.configureTestingModule({
      imports: [InteligenciaComponent],
      providers: [{ provide: IAService, useValue: iaSpy }]
    }).compileComponents();
    fixture = TestBed.createComponent(InteligenciaComponent);
    component = fixture.componentInstance;
  });

  it('presenta inventario por sucursal como tabla de negocio y no como nombre técnico', () => {
    const respuesta: ReporteRespuestaDTO = {
      funcion_usada: 'inventarioPorSucursal',
      parametros: {},
      datos: {
        inventario_por_sucursal: [{
          sucursal: 'Central', variantes: 3, disponible: 18, reservado: 2, en_transito: 1
        }],
        total: 1
      },
      narrativa: 'Inventario disponible agrupado por sucursal.',
      proveedor: 'GEMINI'
    };
    iaSpy.generarReporte.and.returnValue(of(respuesta));
    component.consulta = 'inventario por sucursal';
    component.generarReporte();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Inventario por sucursal');
    expect(texto).toContain('Central');
    expect(texto).toContain('Disponible');
    expect(texto).not.toContain('inventarioPorSucursal');
  });

  it('renderiza visualización de ventas por sucursal con barras horizontales e importes en Bs', () => {
    component.reporte = {
      funcion_usada: 'ventasPorSucursal',
      parametros: {},
      datos: {
        por_sucursal: [
          { sucursal: 'Central Calacoto', ventas: 20, ingresos: '6500.00' },
          { sucursal: 'Sucursal Equipetrol', ventas: 10, ingresos: '3200.00' }
        ],
        total: 2
      },
      narrativa: 'Ventas lideradas por Central Calacoto.',
      proveedor: 'DETERMINISTA'
    };
    fixture.detectChanges();

    const vm = component.ventasPorSucursalBarsVM;
    expect(vm.length).toBe(2);
    expect(vm[0].etiqueta).toBe('Central Calacoto');
    expect(vm[0].valor).toBe(6500);
    expect(vm[0].valorFormateado).toContain('Bs');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Facturación comparativa por sucursal');
    expect(compiled.textContent).toContain('Central Calacoto');
  });

  it('renderiza visualización de temporadas activas con aclaración de alcance', () => {
    component.reporte = {
      funcion_usada: 'ventasPorTemporada',
      parametros: {},
      datos: {
        temporadas: ['Otoño Urbano 2026', 'Primavera Seda 2026'],
        total: 2
      },
      narrativa: 'Temporadas registradas en el catálogo de FashionStore.',
      proveedor: 'GEMINI'
    };
    fixture.detectChanges();

    expect(component.temporadasVM.length).toBe(2);
    expect(component.temporadasVM).toContain('Otoño Urbano 2026');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Temporadas y colecciones del catálogo');
    expect(compiled.textContent).toContain('Otoño Urbano 2026');
    expect(compiled.textContent).toContain('El catálogo no suministra magnitudes comparables');
  });

  it('renderiza stock crítico diferenciando artículos agotados (disponible 0)', () => {
    component.reporte = {
      funcion_usada: 'stockCritico',
      parametros: {},
      datos: {
        criticos: [
          { sku: 'VES-SED-S', disponible: 0 },
          { sku: 'BLU-LIN-M', disponible: 2 }
        ],
        total: 2
      },
      narrativa: 'Dos artículos en umbral crítico.',
      proveedor: 'DETERMINISTA'
    };
    fixture.detectChanges();

    const vm = component.stockCriticoBarsVM;
    expect(vm.length).toBe(2);
    expect(vm[0].nivel).toBe('urgente');
    expect(vm[0].valorFormateado).toContain('Agotado');
    expect(vm[1].nivel).toBe('critico');
  });

  it('renderiza top más vendidos con ranking horizontal', () => {
    component.reporte = {
      funcion_usada: 'topVendidos',
      parametros: {},
      datos: {
        top: [
          { sku: 'VES-SED-01', unidades: 25 },
          { sku: 'CHAQ-DEN-02', unidades: 14 }
        ]
      },
      narrativa: 'Prendas con mayor demanda en ventas pagadas.',
      proveedor: 'GEMINI'
    };
    fixture.detectChanges();

    const vm = component.topVendidosBarsVM;
    expect(vm.length).toBe(2);
    expect(vm[0].etiqueta).toBe('VES-SED-01');
    expect(vm[0].valor).toBe(25);
  });

  it('renderiza efectividad de reservas con progreso circular y maneja total cero de forma segura', () => {
    component.reporte = {
      funcion_usada: 'efectividadReservas',
      parametros: {},
      datos: {
        total: 0,
        completadas: 0,
        conversion: 0.0
      },
      narrativa: 'No se registran reservas en el periodo analizado.',
      proveedor: 'DETERMINISTA'
    };
    fixture.detectChanges();

    const vm = component.reservasReporteVM;
    expect(vm.total).toBe(0);
    expect(vm.conversionPct).toBe(0);
  });

  it('renderiza rotación por temporada con comparación stock vs ventas y etiqueta sin inventar SKU', () => {
    component.reporte = {
      funcion_usada: 'rotacionPorTemporada',
      parametros: {},
      datos: {
        ventana_dias: 45,
        filas: [
          { variante_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', stock: 10, ventas: 5 }
        ]
      },
      narrativa: 'Rotación evaluada en ventana de 45 días.',
      proveedor: 'GEMINI'
    };
    fixture.detectChanges();

    const vm = component.rotacionFilasVM;
    expect(vm.ventanaDias).toBe(45);
    expect(vm.filas.length).toBe(1);
    expect(vm.filas[0].stock).toBe(10);
    expect(vm.filas[0].ventas).toBe(5);
    expect(vm.filas[0].etiquetaLegible).toContain('Ítem de catálogo');
    expect(vm.filas[0].etiquetaLegible).toContain('a1b2c3d4');
  });

  it('proporciona fallback seguro para funciones o datos desconocidos', () => {
    component.reporte = {
      funcion_usada: 'analisisEspecializado' as any,
      parametros: {},
      datos: { metrica_personalizada: 123 },
      narrativa: 'Análisis detallado sin gráfico predeterminado.',
      proveedor: 'GEMINI'
    };
    fixture.detectChanges();

    expect(component.esFuncionDesconocida).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Resultado de consulta en formato detallado');
    expect(compiled.querySelector('.ia-datos-colapsable')).toBeTruthy();
  });

  it('explica un reporte sin registros en lugar de mostrar solo un objeto vacío', () => {
    component.reporte = {
      funcion_usada: 'ventasPorSucursal',
      parametros: {},
      datos: { por_sucursal: [], total: 0 },
      narrativa: 'No se encontraron ventas confirmadas.',
      proveedor: 'DETERMINISTA'
    };
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No existen registros que coincidan con este reporte en el periodo consultado.'
    );
  });

  it('cambia entre pestañas de reportes y decisiones de inventario', () => {
    fixture.detectChanges();
    expect(component.activeTab).toBe('reportes');

    const tabs = fixture.nativeElement.querySelectorAll('.tab-switcher button') as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBe(2);

    tabs[1].click();
    fixture.detectChanges();
    expect(component.activeTab).toBe('decisiones');

    const btnAnalizar = fixture.nativeElement.querySelector('.btn-analizar') as HTMLButtonElement;
    expect(btnAnalizar).toBeTruthy();
    expect(btnAnalizar.textContent).toContain('Analizar inventario');
  });

  it('consulta decisiones de inventario y presenta la comparación visual stock vs ventas', () => {
    const mockDecisiones: DecisionRespuestaDTO = {
      proveedor: 'HEURISTICO',
      items: [
        {
          variante_id: 'var-1',
          sku: 'CHAQ-URB-01',
          accion: 'REPOSICION',
          detalle: 'Stock bajo en sucursal Central.',
          stock_total: 2,
          ventas_periodo: 14,
          reposicion_sugerida: 10
        }
      ]
    };
    iaSpy.decisionesInventario.and.returnValue(of(mockDecisiones));

    component.activeTab = 'decisiones';
    component.diasVentana = 45;
    component.umbralRotacion = 8;
    component.consultarDecisiones();
    fixture.detectChanges();

    expect(iaSpy.decisionesInventario).toHaveBeenCalledWith({ dias_ventana: 45, umbral_rotacion: 8 });
    expect(component.decisiones).toEqual(mockDecisiones);

    const dVM = component.decisionesVM;
    expect(dVM.length).toBe(1);
    expect(dVM[0].stockPct).toBeLessThan(dVM[0].ventasPct);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('CHAQ-URB-01');
    expect(compiled.textContent).toContain('Stock bajo en sucursal Central.');
    expect(compiled.textContent).toContain('Reposición');
    expect(compiled.textContent).toContain('+10 un.');
  });

  it('maneja de forma segura errores de la API en reportes y decisiones', () => {
    iaSpy.generarReporte.and.returnValue(throwError(() => new Error('Error de conexión con IA')));
    component.consulta = 'ventas';
    component.generarReporte();
    fixture.detectChanges();

    expect(component.generando).toBeFalse();
    expect(component.errorReporte).toBeTruthy();

    iaSpy.decisionesInventario.and.returnValue(throwError(() => new Error('Fallo al evaluar inventario')));
    component.consultarDecisiones();
    fixture.detectChanges();

    expect(component.consultando).toBeFalse();
    expect(component.errorDecision).toBeTruthy();
  });

  describe('Verificaciones estructurales de responsividad y accesibilidad (320, 360, 390, 768, 1024 y 1440 px)', () => {
    it('las pestañas de navegación cumplen especificación ARIA y navegación por teclado', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const tablist = compiled.querySelector('.tab-switcher');
      expect(tablist?.getAttribute('role')).toBe('tablist');
      expect(tablist?.getAttribute('aria-label')).toBe('Secciones de inteligencia');

      const tabs = compiled.querySelectorAll('.tab-switcher button');
      expect(tabs.length).toBe(2);

      const tabReportes = tabs[0];
      const tabDecisiones = tabs[1];

      expect(tabReportes.getAttribute('role')).toBe('tab');
      expect(tabReportes.getAttribute('type')).toBe('button');
      expect(tabReportes.getAttribute('aria-selected')).toBe('true');
      expect(tabReportes.getAttribute('aria-controls')).toBe('panel-reportes');

      expect(tabDecisiones.getAttribute('role')).toBe('tab');
      expect(tabDecisiones.getAttribute('type')).toBe('button');
      expect(tabDecisiones.getAttribute('aria-selected')).toBe('false');
      expect(tabDecisiones.getAttribute('aria-controls')).toBe('panel-decisiones');

      // Al alternar a decisiones
      component.activeTab = 'decisiones';
      fixture.detectChanges();

      expect(tabReportes.getAttribute('aria-selected')).toBe('false');
      expect(tabDecisiones.getAttribute('aria-selected')).toBe('true');

      const panelDecisiones = compiled.querySelector('#panel-decisiones');
      expect(panelDecisiones?.getAttribute('role')).toBe('tabpanel');
      expect(panelDecisiones?.getAttribute('aria-labelledby')).toBe('tab-decisiones');
    });

    it('todos los botones y campos de entrada cuentan con atributos táctiles y accesibles', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const botones = compiled.querySelectorAll('button');
      botones.forEach(btn => {
        expect(btn.getAttribute('type')).toBe('button');
        const tieneTexto = (btn.textContent?.trim().length ?? 0) > 0;
        const tieneAria = btn.hasAttribute('aria-label');
        expect(tieneTexto || tieneAria).toBeTrue();
      });

      const inputs = compiled.querySelectorAll('input');
      inputs.forEach(input => {
        const tieneId = input.hasAttribute('id');
        const tieneAria = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        expect(tieneId || tieneAria).toBeTrue();
      });
    });

    it('soporta textos, narrativas extensas y SKU complejos sin rotura de contenedor', () => {
      component.reporte = {
        funcion_usada: 'ventasPorSucursal',
        parametros: {},
        datos: {
          por_sucursal: [
            { sucursal: 'Boutique Sucursal Central Calacoto Zona Sur La Paz', ventas: 125, ingresos: '9984321.50' }
          ],
          total: 1
        },
        narrativa: 'Esta es una narrativa excepcionalmente detallada y extensa generada para examinar la contención de texto editorial en pantallas móviles estrechas de 320px hasta pantallas ultra anchas de 1440px sin provocar desbordamientos horizontales ni cortes abruptos.',
        proveedor: 'GEMINI'
      };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Boutique Sucursal Central Calacoto');
      expect(compiled.textContent).toContain('9.984.321,50');
      expect(compiled.textContent).toContain('Esta es una narrativa excepcionalmente detallada');
    });

    it('renderiza tarjetas de decisiones con comparador visual de ratio en SVG sin estilos inline', () => {
      component.activeTab = 'decisiones';
      component.decisiones = {
        proveedor: 'MOTOR_LOCAL',
        items: [
          {
            variante_id: 'var-long-12345678',
            sku: 'SKU-VESTIDO-SEDA-NOIR-EDICION-LIMITADA-2026-XL',
            accion: 'PROMOCION',
            detalle: 'Rotación lenta observada en ventana de 45 días.',
            stock_total: 8,
            ventas_periodo: 1,
            reposicion_sugerida: 0
          }
        ]
      };
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const ratioSvgs = compiled.querySelectorAll('.ratio-svg');
      expect(ratioSvgs.length).toBe(2); // Un SVG para stock y uno para ventas

      ratioSvgs.forEach(svg => {
        expect(svg.getAttribute('viewBox')).toBe('0 0 100 6');
        const rect = svg.querySelector('.ratio-fill-rect');
        expect(rect?.hasAttribute('width')).toBeTrue();
        expect(rect?.getAttribute('style')).toBeNull(); // Cero inline styles
      });
    });
  });
});
