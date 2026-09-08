import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    router.navigate(['/auth/login'], { queryParams: { redirectUrl: state.url } });
    return false;
  }

  // Si la ruta define roles permitidos en data: { roles: ['ADMINISTRADOR', ...] }
  const rolesPermitidos = route.data?.['roles'] as Array<string> | undefined;
  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const usuario = authService.obtenerUsuarioActual();
    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      router.navigate(['/'], { queryParams: { denegado: '1' } });
      return false;
    }
  }

  return true;
};
