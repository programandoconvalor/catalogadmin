
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';

import { AuthService } from '../../../../core/auth/auth.service';
import { TenantContextService } from '../../../../core/tenant/tenant-context.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: '',
})
export class SigninFormComponent {
  showPassword = false;
  isChecked = false;

  email = '';
  password = '';

  emailTouched = false;
  passwordTouched = false;

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  constructor(
    private readonly authService: AuthService,
    private readonly tenantContextService: TenantContextService,
    private readonly router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Valida el formato del correo electrónico.
   * Se eliminan los espacios al inicio y al final.
   */
  isValidEmail(value: string): boolean {
    const email = value.trim();

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  onEmailChange(value: string | number): void {
    this.email = String(value);
    this.emailTouched = true;

    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  onPasswordChange(value: string | number): void {
    this.password = String(value);
    this.passwordTouched = true;

    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  async onSignIn(): Promise<void> {
    this.emailTouched = true;
    this.passwordTouched = true;

    const normalizedEmail = this.email.trim();

    // Validar correo electrónico.
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

    // Validar contraseña.
    if (!this.password) {
      this.errorMessage.set('Ingresa tu contraseña.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // 1. Autenticar al usuario con Firebase Authentication.
      const user = await this.authService.signIn(
        normalizedEmail,
        this.password,
        this.isChecked
      );

      console.log(
        '[SigninForm] Usuario autenticado:',
        user.uid
      );

      // 2. Cargar el contexto de la florería.
      const tenantContext =
        await this.tenantContextService.loadByUid(user.uid);

      // 3. Verificar que el usuario tenga una florería asociada.
      if (!tenantContext) {
        console.warn(
          '[SigninForm] El usuario no tiene un tenant asociado.'
        );

        await this.authService.signOut();

        this.errorMessage.set(
          'Tu usuario no está asociado a una cuenta de florería.'
        );

        return;
      }

      console.log(
        '[SigninForm] Tenant:',
        tenantContext.tenantId
      );

      console.log(
        '[SigninForm] Role:',
        tenantContext.member.role
      );

      // 4. Navegar al dashboard.
      console.log(
        '[SigninForm] Inicio de sesión completado correctamente.'
      );

      await this.router.navigate(['/']);
    } catch (error: unknown) {
      console.error(
        '[SigninForm] Error de autenticación:',
        error
      );

      const authError = error as { code?: string };

      switch (authError?.code) {
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          this.errorMessage.set(
            'Correo o contraseña incorrectos.'
          );
          break;

        case 'auth/user-disabled':
          this.errorMessage.set(
            'Este usuario está deshabilitado.'
          );
          break;

        case 'auth/too-many-requests':
          this.errorMessage.set(
            'Demasiados intentos. Intenta nuevamente más tarde.'
          );
          break;

        case 'auth/network-request-failed':
          this.errorMessage.set(
            'No se pudo conectar con Firebase. Verifica tu conexión a internet.'
          );
          break;

        default:
          this.errorMessage.set(
            'No fue posible iniciar sesión. Intenta nuevamente.'
          );
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
