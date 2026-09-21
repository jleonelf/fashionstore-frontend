import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InteligenciaComponent } from './inteligencia.component';
import { IAService } from '../../core/services/ia.service';
import { ReporteRespuestaDTO } from '../../core/models/ciclo3.models';

describe('InteligenciaComponent', () => {
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

  it('explica un reporte sin registros en lugar de mostrar solo un objeto vacío', () => {
    component.reporte = {
      funcion_usada: 'ventasPorSucursal', parametros: {}, datos: { por_sucursal: [], total: 0 },
      narrativa: 'No se encontraron ventas confirmadas.', proveedor: 'DETERMINISTA'
    };
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No existen registros que coincidan con este reporte todavía.'
    );
  });
});
