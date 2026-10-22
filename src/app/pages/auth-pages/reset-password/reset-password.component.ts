
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [
    AuthPageLayoutComponent,
    InputFieldComponent,
    LabelComponent,
    ButtonComponent,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './reset-password.component.html',
  styles: '',
})
export class ResetPasswordComponent {
  email = '';
  emailTouched = false;

  readonly isLoading = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  constructor(private readonly authService: AuthService) {}

  /**
   * Valida el formato del correo electrónico.
   * Permite dominios con subdominios y elimina espacios externos.
   */
  isValidEmail(value: string): boolean {
    const email = value.trim();

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  onEmailChange(value: string | number): void {
    this.email = String(value);
    this.emailTouched = true;

    this.successMessage.set('');
    this.errorMessage.set('');
  }

  async onSubmit(): Promise<void> {
    this.emailTouched = true;
    this.successMessage.set('');
    this.errorMessage.set('');

    const normalizedEmail = this.email.trim();

    if (!normalizedEmail) {
      this.errorMessage.set('Ingresa tu correo electrónico.');
      return;
    }

    if (!this.isValidEmail(normalizedEmail)) {
      this.errorMessage.set(
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.sendPasswordReset(normalizedEmail);

      // Mensaje neutro para proteger la privacidad de las cuentas.
      this.successMessage.set(
        'Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer la contraseña. Revisa también la carpeta de spam.'
      );

      this.emailTouched = false;
    } catch (error: unknown) {
      console.error(
        '[ResetPassword] Error al solicitar recuperación:',
        error
      );

      const authError = error as { code?: string };

      switch (authError?.code) {
        case 'auth/invalid-email':
          this.errorMessage.set(
            'El correo electrónico no tiene un formato válido. Verifica la dirección e inténtalo de nuevo.'
          );
          break;

        case 'auth/too-many-requests':
          this.errorMessage.set(
            'Se realizaron demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.'
          );
          break;

        case 'auth/network-request-failed':
          this.errorMessage.set(
            'No fue posible conectar con Firebase. Revisa tu conexión e inténtalo de nuevo.'
          );
          break;

        default:
          this.errorMessage.set(
            'No se pudo procesar la solicitud en este momento. Inténtalo de nuevo más tarde.'
          );
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
