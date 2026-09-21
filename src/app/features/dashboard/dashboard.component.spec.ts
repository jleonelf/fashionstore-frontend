import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardDTO } from '../../core/models/ciclo3.models';
import { SucursalDTO } from '../../core/models/organizacion.models';

describe('DashboardComponent (Contrato Real de Indicadores y Filtros por Rol)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
  let orgServiceSpy: jasmine.SpyObj<OrganizacionService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockDashboardReal: DashboardDTO = {
    desde: '2026-09-01T00:00:00Z',
    hasta: '2026-09-20T23:59:59Z',
    ventas_total: 45,
    ingresos_total: '12500.50',
    margen_bruto_total: '4200.00',
    ticket_promedio: '277.79',
    por_sucursal: [
      { sucursal_id: 'suc-1', sucursal_nombre: 'Central Calacoto', ventas: 30, ingresos: '8500.00' },
      { sucursal_id: 'suc-2', sucursal_nombre: 'Sucursal Equipetrol', ventas: 15, ingresos: '4000.50' }
    ],
    top_productos: [
      { producto: 'Vestido Seda Noir', unidades: 18 },
      { producto: 'Blusa Lino Beige', unidades: 12 }
    ],
    stock_critico: [
      { sku: 'BLU-LIN-M', sucursal_id: 'suc-1', disponible: 2, existencia: 4 },
      { sku: 'VES-SED-S', sucursal_id: 'suc-2', disponible: 1, existencia: 1 }
    ],
    valorizacion_total: '38900.00',
    conversion_reservas: {
      total: 50,
      completadas: 40,
      tasa: 0.80
    },
    estados_pedidos: {
      SOLICITADO: 5,
      PREPARADO: 10,
      EN_REPARTO: 4,
      ENTREGADO: 25,
      CANCELADO: 1
    },
    efectividad_promociones: {
      con_promocion: 20,
      sin_promocion: 25,
      descuento_total: '1500.00'
    }
  };

  const mockSucursales: SucursalDTO[] = [
    {
      id: 'suc-1',
      ciudad_id: 'c-1',
      nombre: 'Central Calacoto',
      direccion: 'Av. Ballivian 123',
      telefono: '70000000',
      numero_anillo: 1,
      tarifa_base_delivery: 15,
      incremento_anillo_delivery: 5,
      anillo_minimo_delivery: 1,
      anillo_maximo_delivery: 5,
      delivery_activo: true,
      activa: true
    }
  ];

  beforeEach(async () => {
    dashboardServiceSpy = jasmine.createSpyObj<DashboardService>('DashboardService', ['consultar']);
    orgServiceSpy = jasmine.createSpyObj<OrganizacionService>('OrganizacionService', ['gestionarSucursales']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['obtenerUsuarioActual']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    dashboardServiceSpy.consultar.and.returnValue(of(mockDashboardReal));
    orgServiceSpy.gestionarSucursales.and.returnValue(of(mockSucursales));
    authServiceSpy.obtenerUsuarioActual.and.returnValue({
      id: 'u-admin',
      usuario_id: 'u-admin',
      nombres: 'Admin',
      apellidos: 'Principal',
      nombre_completo: 'Admin Principal',
      correo_electronico: 'admin@fs.com',
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVO',
      preferencias: {},
      creado_en: '2026-01-01'
    });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: OrganizacionService, useValue: orgServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (k: string) => (k === 'sucursal' ? 'suc-1' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('valida que el dashboard reciba y procese el contrato real del backend', () => {
    expect(component.dashboard).toEqual(mockDashboardReal);
    const d = component.dashboard!;

    // KPIs obligatorios
    expect(d.ventas_total).toBe(45);
    expect(Number(d.ingresos_total)).toBe(12500.50);
    expect(Number(d.margen_bruto_total)).toBe(4200.00);
    expect(Number(d.ticket_promedio)).toBe(277.79);
    expect(Number(d.valorizacion_total)).toBe(38900.00);

    // por_sucursal con campos reales
    expect(d.por_sucursal.length).toBe(2);
    expect(d.por_sucursal[0].sucursal_id).toBe('suc-1');
    expect(d.por_sucursal[0].sucursal_nombre).toBe('Central Calacoto');
    expect(d.por_sucursal[0].ventas).toBe(30);
    expect(d.por_sucursal[0].ingresos).toBe('8500.00');

    // top_productos con producto y unidades (no producto_id ni nombre antiguo)
    expect(d.top_productos[0].producto).toBe('Vestido Seda Noir');
    expect(d.top_productos[0].unidades).toBe(18);

    // stock_critico con sku, sucursal_id, disponible y existencia (no stock plano antiguo)
    expect(d.stock_critico[0].sku).toBe('BLU-LIN-M');
    expect(d.stock_critico[0].sucursal_id).toBe('suc-1');
    expect(d.stock_critico[0].disponible).toBe(2);
    expect(d.stock_critico[0].existencia).toBe(4);

    // conversion_reservas con total, completadas, tasa (no tasa_conversion antigua)
    expect(d.conversion_reservas.total).toBe(50);
    expect(d.conversion_reservas.completadas).toBe(40);
    expect(d.conversion_reservas.tasa).toBe(0.80);

    // estados_pedidos diccionario
    expect(d.estados_pedidos['SOLICITADO']).toBe(5);
    expect(d.estados_pedidos['ENTREGADO']).toBe(25);
    expect(component.clavesEstadosPedidos()).toContain('SOLICITADO');

    // efectividad_promociones con con_promocion, sin_promocion, descuento_total
    expect(d.efectividad_promociones.con_promocion).toBe(20);
    expect(d.efectividad_promociones.sin_promocion).toBe(25);
    expect(d.efectividad_promociones.descuento_total).toBe('1500.00');
  });

  it('formatea moneda boliviana adecuadamente', () => {
    expect(component.bs(12500.50)).toContain('Bs');
    expect(component.bs('12500.50')).toContain('Bs');
  });

  it('restringe la sucursal forzada si el rol es ENCARGADO', () => {
    authServiceSpy.obtenerUsuarioActual.and.returnValue({
      id: 'u-enc',
      usuario_id: 'u-enc',
      nombres: 'Encargado',
      apellidos: 'Calacoto',
      nombre_completo: 'Encargado Calacoto',
      correo_electronico: 'enc@fs.com',
      rol: 'ENCARGADO',
      estado: 'ACTIVO',
      sucursal_id: 'suc-calacoto',
      preferencias: {},
      creado_en: '2026-01-01'
    });

    component.ngOnInit();

    expect(component.esAdmin).toBeFalse();
    expect(component.sucursalFiltro).toBe('suc-calacoto');
  });
});
