import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    title: 'FashionStore — La ropa se prueba. La ciudad te la acerca.'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar Sesión — FashionStore'
  },
  {
    path: 'auth/registro',
    loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent),
    title: 'Registro de Cliente — FashionStore'
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./features/catalogo/catalogo.component').then(m => m.CatalogoComponent),
    title: 'Catálogo — FashionStore'
  },
  // CLIENTE — Compra digital
  {
    path: 'carrito',
    loadComponent: () => import('./features/carrito/carrito.component').then(m => m.CarritoComponent),
    canActivate: [authGuard],
    data: { roles: ['CLIENTE'] },
    title: 'Mi carrito — FashionStore'
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard],
    data: { roles: ['CLIENTE'] },
    title: 'Checkout — FashionStore'
  },
  {
    path: 'pago/:ventaId',
    loadComponent: () => import('./features/pago/pago.component').then(m => m.PagoComponent),
    canActivate: [authGuard],
    data: { roles: ['CLIENTE', 'ADMINISTRADOR'] },
    title: 'Pago — FashionStore'
  },
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./features/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent),
    canActivate: [authGuard],
    data: { roles: ['CLIENTE'] },
    title: 'Mis pedidos — FashionStore'
  },
  {
    path: 'mis-pedidos/:id',
    loadComponent: () => import('./features/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent),
    canActivate: [authGuard],
    data: { roles: ['CLIENTE'] },
    title: 'Detalle de pedido — FashionStore'
  },
  {
    path: 'historial',
    loadComponent: () => import('./features/historial/historial.component').then(m => m.HistorialComponent),
    canActivate: [authGuard],
    data: { roles: ['CLIENTE'] },
    title: 'Historial de compras — FashionStore'
  },
  {
    path: 'reservas',
    loadComponent: () => import('./features/reservas/reservas.component').then(m => m.ReservasComponent),
    canActivate: [authGuard],
    data: { roles: ['CLIENTE', 'ADMINISTRADOR', 'ENCARGADO'] },
    title: 'Reservas — FashionStore'
  },
  // Operativo — Cola de pedidos
  {
    path: 'pedidos',
    loadComponent: () => import('./features/pedidos/pedidos.component').then(m => m.PedidosComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO', 'CAJERO'] },
    title: 'Cola de pedidos — FashionStore'
  },
  // Gestión
  {
    path: 'promociones',
    loadComponent: () => import('./features/promociones/promociones.component').then(m => m.PromocionesComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] },
    title: 'Promociones — FashionStore'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] },
    title: 'Dashboard — FashionStore'
  },
  {
    path: 'inteligencia',
    loadComponent: () => import('./features/inteligencia/inteligencia.component').then(m => m.InteligenciaComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] },
    title: 'Inteligencia — FashionStore'
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Gestión de usuarios — FashionStore'
  },
  {
    path: 'sucursales',
    loadComponent: () => import('./features/sucursales/sucursales.component').then(m => m.SucursalesComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Sucursales y delivery — FashionStore'
  },
  {
    path: 'recepciones',
    loadComponent: () => import('./features/recepciones/recepciones.component').then(m => m.RecepcionesComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Recepción de lotes — FashionStore'
  },
  {
    path: 'productos',
    loadComponent: () => import('./features/productos/productos.component').then(m => m.ProductosComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    title: 'Productos y variantes — FashionStore'
  },
  {
    path: 'inventario',
    loadComponent: () => import('./features/inventario/inventario.component').then(m => m.InventarioComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO', 'CAJERO'] },
    title: 'Kardex e inventario — FashionStore'
  },
  {
    path: 'traslados',
    loadComponent: () => import('./features/traslados/traslados.component').then(m => m.TrasladosComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] },
    title: 'Traslados — FashionStore'
  },
  {
    path: 'caja',
    loadComponent: () => import('./features/caja/caja.component').then(m => m.CajaComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'CAJERO'] },
    title: 'Caja — FashionStore'
  },
  {
    path: 'operaciones',
    loadComponent: () => import('./features/operaciones/operaciones.component').then(m => m.OperacionesComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'ENCARGADO'] },
    title: 'Operaciones de tienda — FashionStore'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
