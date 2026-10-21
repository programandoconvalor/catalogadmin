import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  filter,
  firstValueFrom,
  take,
} from 'rxjs';

import { AuthService } from './auth.service';
import { TenantContextService } from '../tenant/tenant-context.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const tenantContextService =
    inject(TenantContextService);
  const router = inject(Router);

  /*
   * ============================================
   * 1. ESPERAR A QUE FIREBASE INICIALICE AUTH
   * ============================================
   */

  await firstValueFrom(
    authService.authInitialized$.pipe(
      filter((initialized) => initialized),
      take(1)
    )
  );

  /*
   * ============================================
   * 2. VALIDAR AUTENTICACIÓN
   * ============================================
   */

  const user = authService.currentUser;

  console.log(
    '[AuthGuard] Auth initialized:',
    authService.isAuthInitialized
  );

  console.log(
    '[AuthGuard] Authenticated:',
    !!user
  );

  if (!user) {
    console.log(
      '[AuthGuard] Usuario no autenticado. Redirigiendo a /signin.'
    );

    return router.createUrlTree([
      '/signin',
    ]);
  }

  /*
   * ============================================
   * 3. VALIDAR TENANT CONTEXT
   * ============================================
   *
   * Si ya tenemos el contexto cargado para
   * este usuario, reutilizarlo.
   */

  const currentContext =
    tenantContextService.current;

  if (
    currentContext &&
    currentContext.member.uid === user.uid
  ) {
    console.log(
      '[AuthGuard] Tenant context ya cargado:',
      currentContext.tenantId
    );

    console.log(
      '[AuthGuard] Role:',
      currentContext.member.role
    );

    return true;
  }

  /*
   * ============================================
   * 4. CARGAR TENANT DEL USUARIO
   * ============================================
   */

  console.log(
    '[AuthGuard] Cargando TenantContext para:',
    user.uid
  );

  try {
    const tenantContext =
      await tenantContextService.loadByUid(
        user.uid
      );

    /*
     * ==========================================
     * 5. VALIDAR TENANT
     * ==========================================
     */

    if (!tenantContext) {
      console.warn(
        '[AuthGuard] El usuario no tiene un tenant válido.'
      );

      /*
       * Limpiar contexto
       */
      tenantContextService.clear();

      /*
       * Cerrar sesión porque una cuenta
       * autenticada sin tenant válido no debe
       * acceder al administrador.
       */
      await authService.signOut();

      return router.createUrlTree([
        '/signin',
      ]);
    }

    /*
     * ==========================================
     * 6. TENANT VÁLIDO
     * ==========================================
     */

    console.log(
      '[AuthGuard] Tenant válido:',
      tenantContext.tenantId
    );

    console.log(
      '[AuthGuard] Tenant:',
      tenantContext.tenant.name
    );

    console.log(
      '[AuthGuard] Role:',
      tenantContext.member.role
    );

    console.log(
      '[AuthGuard] Acceso permitido.'
    );

    return true;

  } catch (error) {

    console.error(
      '[AuthGuard] Error validando TenantContext:',
      error
    );

    tenantContextService.clear();

    try {
      await authService.signOut();
    } catch (signOutError) {
      console.error(
        '[AuthGuard] Error cerrando sesión:',
        signOutError
      );
    }

    return router.createUrlTree([
      '/signin',
    ]);
  }
};