import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegistroComponent } from './features/auth/registro/registro.component';
import { UsuariosComponent } from './features/usuarios/usuarios.component';
import { SucursalesComponent } from './features/sucursales/sucursales.component';

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
    title: 'Gestión de Usuarios — FashionStore'
  },
  {
    path: 'sucursales',
    component: SucursalesComponent,
    title: 'Sucursales y Delivery — FashionStore'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
