import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegistroComponent } from './features/auth/registro/registro.component';
import { UsuariosComponent } from './features/usuarios/usuarios.component';
import { SucursalesComponent } from './features/sucursales/sucursales.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
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
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] },
    title: 'Sucursales y Delivery (CU03) — FashionStore'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
