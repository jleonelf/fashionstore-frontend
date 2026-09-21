import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CheckoutComponent } from './checkout.component';
import { CarritoService } from '../../core/services/carrito.service';
import { EntregaService } from '../../core/services/entrega.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { EnriquecimientoService } from '../../core/services/enriquecimiento.service';
import { CarritoDTO, CoberturaDTO, CotizacionDTO } from '../../core/models/ciclo3.models';
import { SucursalDTO } from '../../core/models/organizacion.models';

describe('CheckoutComponent (Formulario reactivo, Validaciones e Idempotencia)', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let entregaServiceSpy: jasmine.SpyObj<EntregaService>;
  let orgServiceSpy: jasmine.SpyObj<OrganizacionService>;
  let enriquecimientoServiceSpy: jasmine.SpyObj<EnriquecimientoService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockCarrito: CarritoDTO = {
    id: 'cart-1',
    cliente_id: 'cli-1',
    canal: 'WEB',
    estado: 'ACTIVO',
    creada_en: '2026-09-20T10:00:00Z',
    actualizada_en: '2026-09-20T10:00:00Z',
    lineas: [
      { id: 'l-1', variante_id: 'v-1', cantidad: 2, precio_unitario: 100, descuento_unitario: 0, promocion_id: null, subtotal: 200 }
    ],
    subtotal: 200,
    descuento_total: 0,
    total: 200
  };

  const mockCobertura: CoberturaDTO = {
    sucursales: [
      {
        sucursal_id: 'suc-1',
        sucursal_nombre: 'Sucursal Central',
        cubre_todo: true,
        faltantes: []
      }
    ]
  };

  const mockSucursales: SucursalDTO[] = [
    {
      id: 'suc-1',
      ciudad_id: 'ciu-1',
      nombre: 'Sucursal Central',
      direccion: 'Av. Siempre Viva 123',
      telefono: '70000000',
      numero_anillo: 1,
      tarifa_base_delivery: 15,
      incremento_anillo_delivery: 5,
      anillo_minimo_delivery: 1,
      anillo_maximo_delivery: 5,
      delivery_activo: true,
      activa: true
    },
    {
      id: 'suc-2',
      ciudad_id: 'ciu-1',
      nombre: 'Sucursal Peatonal',
      direccion: 'Calle Comercio 456',
      telefono: '70000001',
      numero_anillo: 1,
      tarifa_base_delivery: 0,
      incremento_anillo_delivery: 0,
      anillo_minimo_delivery: 1,
      anillo_maximo_delivery: 1,
      delivery_activo: false,
      activa: true
    }
  ];

  beforeEach(async () => {
    carritoServiceSpy = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'obtenerMio', 'cobertura', 'checkout'
    ]);
    entregaServiceSpy = jasmine.createSpyObj<EntregaService>('EntregaService', ['cotizar']);
    orgServiceSpy = jasmine.createSpyObj<OrganizacionService>('OrganizacionService', ['gestionarSucursales']);
    enriquecimientoServiceSpy = jasmine.createSpyObj<EnriquecimientoService>('EnriquecimientoService', ['obtenerVariante']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    carritoServiceSpy.obtenerMio.and.returnValue(of(mockCarrito));
    carritoServiceSpy.cobertura.and.returnValue(of(mockCobertura));
    orgServiceSpy.gestionarSucursales.and.returnValue(of(mockSucursales));
    enriquecimientoServiceSpy.obtenerVariante.and.returnValue(of({
      variante_id: 'v-1',
      sku: 'SKU-01',
      precio: 100,
      producto_id: 'prod-1',
      nombre_producto: 'Camisa Lino',
      talla_nombre: 'M',
      color_nombre: 'Blanco',
      imagen_url: ''
    }));

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: CarritoService, useValue: carritoServiceSpy },
        { provide: EntregaService, useValue: entregaServiceSpy },
        { provide: OrganizacionService, useValue: orgServiceSpy },
        { provide: EnriquecimientoService, useValue: enriquecimientoServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicializa los datos del carrito, cobertura y sucursales', () => {
    expect(component.carrito).toEqual(mockCarrito);
    expect(component.cobertura).toEqual(mockCobertura);
    expect(component.sucursales.length).toBe(2);
    expect(component.cargando).toBeFalse();
  });

  describe('Validación de modalidad RECOJO', () => {
    it('requiere sucursal pero no exige dirección ni anillo', () => {
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('RECOJO');

      expect(component.checkoutForm.valid).toBeTrue();
      expect(component.puedeConfirmar).toBeTrue();
    });

    it('es inválido si falta seleccionar la sucursal', () => {
      component.checkoutForm.controls.sucursalId.setValue('');
      component.checkoutForm.controls.modalidad.setValue('RECOJO');

      expect(component.puedeConfirmar).toBeFalse();
    });
  });

  describe('Validación de modalidad DELIVERY', () => {
    beforeEach(() => {
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('DELIVERY');
    });

    it('exige dirección, anillo (1-12) y cotización calculada para poder confirmar', () => {
      // Sin dirección ni anillo ni cotización
      expect(component.puedeConfirmar).toBeFalse();

      // Con dirección muy corta
      component.checkoutForm.controls.direccion.setValue('Abc');
      component.checkoutForm.controls.anilloDestino.setValue(2);
      expect(component.checkoutForm.controls.direccion.valid).toBeFalse();
      expect(component.puedeConfirmar).toBeFalse();

      // Con dirección válida y anillo pero sin cotización
      component.checkoutForm.controls.direccion.setValue('Calle Los Pinos #456');
      expect(component.checkoutForm.controls.direccion.valid).toBeTrue();
      expect(component.puedeConfirmar).toBeFalse();

      // Al recibir cotización exitosa, puedeConfirmar es verdadero
      const mockCotizacion: CotizacionDTO = {
        sucursal_id: 'suc-1',
        anillo_sucursal: 1,
        anillo_destino: 2,
        costo_entrega: 15,
        tarifa_base: 10,
        incremento_anillo: 5
      };
      component.cotizacion = mockCotizacion;
      expect(component.puedeConfirmar).toBeTrue();
    });

    it('ejecuta cotización mediante EntregaService', () => {
      const mockCotizacion: CotizacionDTO = {
        sucursal_id: 'suc-1',
        anillo_sucursal: 1,
        anillo_destino: 3,
        costo_entrega: 20,
        tarifa_base: 10,
        incremento_anillo: 5
      };
      entregaServiceSpy.cotizar.and.returnValue(of(mockCotizacion));

      component.checkoutForm.controls.anilloDestino.setValue(3);
      component.cotizar();

      expect(entregaServiceSpy.cotizar).toHaveBeenCalledWith('suc-1', 3);
      expect(component.cotizacion).toEqual(mockCotizacion);
    });
  });

  describe('Idempotencia y Prevención de Doble Envío', () => {
    it('mantiene la misma Idempotency-Key ante un reintento técnico idéntico tras error', () => {
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('RECOJO');

      // Primer intento: simula error de red
      carritoServiceSpy.checkout.and.returnValue(throwError(() => new Error('Error de conexión')));
      component.confirmarCheckout();

      expect(carritoServiceSpy.checkout).toHaveBeenCalledTimes(1);
      const primeraClave = carritoServiceSpy.checkout.calls.mostRecent().args[1];
      expect(primeraClave).toBeTruthy();
      expect(component.procesando).toBeFalse();

      // Reintento técnico con los mismos parámetros: DEBE conservar la misma clave
      carritoServiceSpy.checkout.and.returnValue(of({ venta_id: 'vta-100' } as any));
      component.confirmarCheckout();

      expect(carritoServiceSpy.checkout).toHaveBeenCalledTimes(2);
      const segundaClave = carritoServiceSpy.checkout.calls.mostRecent().args[1];
      expect(segundaClave).toBe(primeraClave);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/pago', 'vta-100']);
    });

    it('genera una nueva Idempotency-Key cuando cambia el intento lógico (parámetros)', () => {
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('RECOJO');

      carritoServiceSpy.checkout.and.returnValue(of({ venta_id: 'vta-101' } as any));
      component.confirmarCheckout();

      const primeraClave = carritoServiceSpy.checkout.calls.mostRecent().args[1];

      // El usuario cambia a DELIVERY con dirección y cotización
      component.checkoutForm.controls.modalidad.setValue('DELIVERY');
      component.checkoutForm.controls.direccion.setValue('Av. Ballivian 789');
      component.checkoutForm.controls.anilloDestino.setValue(4);
      component.cotizacion = { sucursal_id: 'suc-1', anillo_sucursal: 1, anillo_destino: 4, costo_entrega: 25, tarifa_base: 10, incremento_anillo: 5 };

      component.confirmarCheckout();

      const segundaClave = carritoServiceSpy.checkout.calls.mostRecent().args[1];
      expect(segundaClave).not.toBe(primeraClave);
    });

    it('bloquea envíos duplicados si ya está procesando', () => {
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('RECOJO');

      component.procesando = true;
      component.confirmarCheckout();

      expect(carritoServiceSpy.checkout).not.toHaveBeenCalled();
    });

    it('calcula totalVisible sumando importes sin concatenar cadenas cuando total y delivery son strings', () => {
      component.carrito = { ...mockCarrito, total: '100.50' as any };
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('DELIVERY');
      component.checkoutForm.controls.anilloDestino.setValue(2);
      component.cotizacion = {
        sucursal_id: 'suc-1',
        anillo_sucursal: 1,
        anillo_destino: 2,
        costo_entrega: '15.25' as any,
        tarifa_base: '10.00' as any,
        incremento_anillo: '5.25' as any
      };

      expect(component.totalVisible).toBe(115.75);
      expect(component.bs(component.totalVisible)).toContain('115');
    });

    it('invalida la cotización si cambia la sucursal o el anillo de destino', () => {
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('DELIVERY');
      component.checkoutForm.controls.direccion.setValue('Av. Principal 123');
      component.checkoutForm.controls.anilloDestino.setValue(2);
      component.cotizacion = {
        sucursal_id: 'suc-1',
        anillo_sucursal: 1,
        anillo_destino: 2,
        costo_entrega: 20,
        tarifa_base: 10,
        incremento_anillo: 10
      };

      expect(component.cotizacionEsVigente).toBeTrue();
      expect(component.puedeConfirmar).toBeTrue();

      // Cambia el anillo
      component.checkoutForm.controls.anilloDestino.setValue(4);
      expect(component.cotizacion).toBeNull();
      expect(component.cotizacionEsVigente).toBeFalse();
      expect(component.requiereRecalcularCotizacion).toBeTrue();
      expect(component.puedeConfirmar).toBeFalse();
    });

    it('si se cambia desde una sucursal con delivery hacia una sucursal sin delivery, cambia de forma segura a RECOJO', () => {
      // Configurar sucursal 1 (con delivery) en modalidad DELIVERY
      component.checkoutForm.controls.sucursalId.setValue('suc-1');
      component.checkoutForm.controls.modalidad.setValue('DELIVERY');
      component.checkoutForm.controls.direccion.setValue('Av. Los Olivos 123');
      component.checkoutForm.controls.anilloDestino.setValue(2);
      expect(component.modalidadSeleccionada).toBe('DELIVERY');

      // Cambiar a sucursal 2 (sin delivery)
      component.checkoutForm.controls.sucursalId.setValue('suc-2');

      // Debe haber cambiado a RECOJO automáticamente y eliminado cotización
      expect(component.modalidadSeleccionada).toBe('RECOJO');
      expect(component.cotizacion).toBeNull();
      expect(component.puedeConfirmar).toBeTrue();
    });
  });
});
