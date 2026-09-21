import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { HttpRequest, HttpErrorResponse, HttpHandlerFn } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ClientePerfil } from '../models/auth.models';

describe('authGuard y authInterceptor (Seguridad y RBAC)', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'estaAutenticado',
      'obtenerUsuarioActual',
      'obtenerToken',
      'cerrarSesion'
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'navigate']);
    Object.defineProperty(routerSpy, 'url', { value: '/ruta-protegida', writable: true });

    routerSpy.createUrlTree.and.callFake((commands: any[], navigationExtras?: any) => {
      return {
        toString: () => commands.join('/'),
        queryParams: navigationExtras?.queryParams || {}
      } as unknown as UrlTree;
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  describe('authGuard', () => {
    it('redirige al visitante no autenticado al login y preserva redirectUrl', () => {
      authServiceSpy.estaAutenticado.and.returnValue(false);

      const route = { data: { roles: ['CLIENTE'] } } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/carrito' } as RouterStateSnapshot;

      const resultado = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(resultado).toBeInstanceOf(Object);
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { redirectUrl: '/carrito' } }
      );
      const urlTree = resultado as unknown as { queryParams: Record<string, string> };
      expect(urlTree.queryParams['redirectUrl']).toBe('/carrito');
    });

    it('permite el acceso si el usuario está autenticado y tiene un rol permitido', () => {
      authServiceSpy.estaAutenticado.and.returnValue(true);
      const perfil: ClientePerfil = {
        id: 'usr-1',
        usuario_id: 'usr-1',
        nombres: 'Cliente',
        apellidos: 'Test',
        nombre_completo: 'Cliente Test',
        correo_electronico: 'cliente@test.com',
        rol: 'CLIENTE',
        estado: 'ACTIVO',
        preferencias: {},
        creado_en: '2026-01-01'
      };
      authServiceSpy.obtenerUsuarioActual.and.returnValue(perfil);

      const route = { data: { roles: ['CLIENTE'] } } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/carrito' } as RouterStateSnapshot;

      const resultado = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(resultado).toBeTrue();
      expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
    });

    it('deniega el acceso y redirige a inicio con denegado=1 si el rol no está permitido', () => {
      authServiceSpy.estaAutenticado.and.returnValue(true);
      const perfil: ClientePerfil = {
        id: 'usr-2',
        usuario_id: 'usr-2',
        nombres: 'Cajero',
        apellidos: 'Test',
        nombre_completo: 'Cajero Test',
        correo_electronico: 'cajero@test.com',
        rol: 'CAJERO',
        estado: 'ACTIVO',
        preferencias: {},
        creado_en: '2026-01-01'
      };
      authServiceSpy.obtenerUsuarioActual.and.returnValue(perfil);

      const route = { data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] } } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/dashboard' } as RouterStateSnapshot;

      const resultado = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(
        ['/'],
        { queryParams: { denegado: '1' } }
      );
      const urlTree = resultado as unknown as { queryParams: Record<string, string> };
      expect(urlTree.queryParams['denegado']).toBe('1');
    });

    it('permite acceso si la ruta no especifica roles restringidos', () => {
      authServiceSpy.estaAutenticado.and.returnValue(true);
      authServiceSpy.obtenerUsuarioActual.and.returnValue(null);

      const route = { data: {} } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/perfil' } as RouterStateSnapshot;

      const resultado = TestBed.runInInjectionContext(() => authGuard(route, state));
      expect(resultado).toBeTrue();
    });
  });

  describe('authInterceptor (Tratamiento de 401 y 403)', () => {
    it('adjunta Bearer token en cabecera Authorization si existe', (done) => {
      authServiceSpy.obtenerToken.and.returnValue('mock-token-xyz');
      const req = new HttpRequest('GET', '/api/v1/catalogo');

      const next: HttpHandlerFn = (clonedReq) => {
        expect(clonedReq.headers.get('Authorization')).toBe('Bearer mock-token-xyz');
        return of({} as any);
      };

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          next: () => done(),
          error: done.fail
        });
      });
    });

    it('ante error 401 cierra sesión y redirige a login con sesionExpirada y redirectUrl', (done) => {
      authServiceSpy.obtenerToken.and.returnValue('token-vencido');
      const req = new HttpRequest('GET', '/api/v1/carritos/mio');
      const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });

      const next: HttpHandlerFn = () => throwError(() => error401);

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          next: () => done.fail('Debió fallar con 401'),
          error: (err) => {
            expect(err.status).toBe(401);
            expect(authServiceSpy.cerrarSesion).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login'], {
              queryParams: { redirectUrl: '/ruta-protegida', sesionExpirada: '1' }
            });
            done();
          }
        });
      });
    });

    it('ante error 403 NO cierra sesión ni redirige a login, permitiendo manejo en componente', (done) => {
      authServiceSpy.obtenerToken.and.returnValue('token-valido');
      const req = new HttpRequest('GET', '/api/v1/reportes');
      const error403 = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });

      const next: HttpHandlerFn = () => throwError(() => error403);

      TestBed.runInInjectionContext(() => {
        authInterceptor(req, next).subscribe({
          next: () => done.fail('Debió fallar con 403'),
          error: (err) => {
            expect(err.status).toBe(403);
            expect(authServiceSpy.cerrarSesion).not.toHaveBeenCalled();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });
  });
});
