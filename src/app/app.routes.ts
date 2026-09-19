import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegistroComponent } from './features/auth/registro/registro.component';
import { UsuariosComponent } from './features/usuarios/usuarios.component';
import { SucursalesComponent } from './features/sucursales/sucursales.component';
import { RecepcionesComponent } from './features/recepciones/recepciones.component';
import { ProductosComponent } from './features/productos/productos.component';
import { CatalogoComponent } from './features/catalogo/catalogo.component';
import { InventarioComponent } from './features/inventario/inventario.component';
import { LandingComponent } from './features/landing/landing.component';
import { ReservasComponent } from './features/reservas/reservas.component';
import { TrasladosComponent } from './features/traslados/traslados.component';
import { CajaComponent } from './features/caja/caja.component';
import { OperacionesComponent } from './features/operaciones/operaciones.component';
import { HistorialComponent } from './features/historial/historial.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    title: 'FashionStore — La ropa se prueba. La ciudad te la acerca.'
  },
  {
    path: 'auth/login',
    component: LoginComponent,
    title: 'Iniciar Sesión — FashionStore'
  },
  {
    path: 'auth/registro',
    component: RegistroComponent,
    title: 'Registro de Cliente — FashionStore'
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Gestión de usuarios — FashionStore'
  },
  {
    path: 'sucursales',
    component: SucursalesComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Sucursales y delivery — FashionStore'
  },
  {
    path: 'recepciones',
    component: RecepcionesComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Recepción de lotes — FashionStore'
  },
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Productos y variantes — FashionStore'
  },
  {
    path: 'catalogo',
    component: CatalogoComponent,
    title: 'Catálogo — FashionStore'
  },
  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO', 'CAJERO'] },
    title: 'Kardex e inventario — FashionStore'
  },
  { path: 'reservas', component: ReservasComponent, canActivate: [authGuard], data: { roles: ['CLIENTE', 'ADMINISTRADOR', 'ENCARGADO'] }, title: 'Reservas - FashionStore' },
  { path: 'traslados', component: TrasladosComponent, canActivate: [authGuard], data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] }, title: 'Traslados - FashionStore' },
  { path: 'caja', component: CajaComponent, canActivate: [authGuard], data: { roles: ['ADMINISTRADOR', 'CAJERO'] }, title: 'Caja - FashionStore' },
  { path: 'operaciones', component: OperacionesComponent, canActivate: [authGuard], data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] }, title: 'Operaciones de tienda - FashionStore' },
  { path: 'historial', component: HistorialComponent, canActivate: [authGuard], data: { roles: ['CLIENTE'] }, title: 'Historial de compras - FashionStore' },
  {
    path: '**',
    redirectTo: ''
  }
];
