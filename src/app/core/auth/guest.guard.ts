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

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await firstValueFrom(
    authService.authInitialized$.pipe(
      filter((initialized) => initialized),
      take(1)
    )
  );

  const user = authService.currentUser;

  console.log(
    '[GuestGuard] Auth initialized:',
    authService.isAuthInitialized
  );

  console.log(
    '[GuestGuard] Authenticated:',
    !!user
  );

  if (user) {
    console.log(
      '[GuestGuard] Usuario autenticado. Redirigiendo al dashboard.'
    );

    return router.createUrlTree([
      '/',
    ]);
  }

  console.log(
    '[GuestGuard] Usuario no autenticado. Acceso permitido.'
  );

  return true;
};