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
    title: 'Gestión de Usuarios (CU02) — FashionStore'
  },
  {
    path: 'sucursales',
    component: SucursalesComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Sucursales y Delivery (CU03) — FashionStore'
  },
  {
    path: 'recepciones',
    component: RecepcionesComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Recepción de Lotes (CU04) — FashionStore'
  },
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Productos y Variantes (CU05) — FashionStore'
  },
  {
    path: 'catalogo',
    component: CatalogoComponent,
    title: 'Catálogo (CU06) — FashionStore'
  },
  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO', 'CAJERO'] },
    title: 'Kardex e Inventario (CU07) — FashionStore'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
