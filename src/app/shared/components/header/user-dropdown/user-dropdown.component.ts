import {
  computed,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { TenantContextService } from '../../../../core/tenant/tenant-context.service';

export interface Language {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  badge?: string;
}

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  templateUrl: './user-dropdown.component.html',
  imports: [
    CommonModule,
    RouterModule,
  ],
})
export class UserDropdownComponent
  implements OnInit
{
  isOpen = false;
  subDropdownOpen = false;
  private readonly failedTenantLogoUrl = signal<string | null>(null);

  currentLocale = 'en';

  languages: Language[] = [
    {
      id: 'en',
      name: 'English',
      shortName: 'English',
      flag: 'flag-us.svg',
    },
    {
      id: 'ar',
      name: 'Arabic (Saudi)',
      shortName: 'Arabic',
      flag: 'flag-sa.svg',
      badge: 'RTL',
    },
    {
      id: 'es',
      name: 'Español',
      shortName: 'Español',
      flag: 'flag-es.svg',
    },
    {
      id: 'de',
      name: 'Deutsch',
      shortName: 'Deutsch',
      flag: 'flag-de.svg',
    },
  ];

  constructor(
    private readonly elementRef: ElementRef,
    private readonly authService: AuthService,
    private readonly tenantContextService: TenantContextService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const savedDir =
      localStorage.getItem('dir');

    if (
      savedDir === 'rtl' ||
      document.documentElement.getAttribute(
        'dir'
      ) === 'rtl'
    ) {
      this.currentLocale = 'ar';

      document.documentElement.setAttribute(
        'dir',
        'rtl'
      );
    } else {
      this.currentLocale = 'en';

      document.documentElement.setAttribute(
        'dir',
        'ltr'
      );
    }
  }

  get currentLang(): Language {
    return (
      this.languages.find(
        (language) =>
          language.id === this.currentLocale
      ) ?? this.languages[0]
    );
  }

  /**
   * Tenant actual.
   */
  get tenantName(): string {
    return (
      this.tenantContextService.tenant?.name?.trim() ||
      'Administración de Catálogos para Florerías'
    );
  }

  readonly tenantLogoUrl = computed(() => {
    const logoUrl =
      this.tenantContextService.context$()?.tenant.logoUrl?.trim();

    return logoUrl && logoUrl !== this.failedTenantLogoUrl()
      ? logoUrl
      : null;
  });

  onTenantLogoError(): void {
    const logoUrl =
      this.tenantContextService.tenant?.logoUrl?.trim();

    if (logoUrl) {
      this.failedTenantLogoUrl.set(logoUrl);
    }
  }

  /**
   * Email del usuario autenticado.
   */
  get userEmail(): string {
    return (
      this.tenantContextService.member?.email ??
      this.authService.currentUser?.email ??
      ''
    );
  }

  /**
   * Rol del usuario dentro del tenant.
   */
  get userRole(): string {
    const role =
      this.tenantContextService.role;

    switch (role) {
      case 'owner':
        return 'Propietario';

      case 'admin':
        return 'Administrador';

      case 'editor':
        return 'Editor';

      case 'viewer':
        return 'Visualizador';

      default:
        return '';
    }
  }

  /**
   * Nombre mostrado en el botón superior.
   */
  get displayName(): string {
    const email =
      this.userEmail;

    if (!email) {
      return this.tenantName;
    }

    return email.split('@')[0];
  }

  toggleDropdown(event?: Event): void {
    event?.stopPropagation();

    this.isOpen = !this.isOpen;

    if (!this.isOpen) {
      this.subDropdownOpen = false;
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.subDropdownOpen = false;
  }

  toggleSubDropdown(
    event: Event
  ): void {
    event.stopPropagation();

    this.subDropdownOpen =
      !this.subDropdownOpen;
  }

  selectLanguage(
    id: string,
    event?: Event
  ): void {
    event?.stopPropagation();

    this.currentLocale = id;

    if (id === 'ar') {
      document.documentElement.setAttribute(
        'dir',
        'rtl'
      );

      localStorage.setItem(
        'dir',
        'rtl'
      );
    } else {
      document.documentElement.setAttribute(
        'dir',
        'ltr'
      );

      localStorage.setItem(
        'dir',
        'ltr'
      );
    }

    this.closeDropdown();
  }

  async onSignOut(): Promise<void> {
    try {
      console.log(
        '[UserDropdown] Cerrando sesión...'
      );

      this.tenantContextService.clear();

      await this.authService.signOut();

      console.log(
        '[UserDropdown] Sesión cerrada correctamente.'
      );

      this.closeDropdown();

      await this.router.navigate([
        '/signin',
      ]);
    } catch (error) {
      console.error(
        '[UserDropdown] Error al cerrar sesión:',
        error
      );
    }
  }

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {
    if (
      this.isOpen &&
      !this.elementRef.nativeElement.contains(
        event.target
      )
    ) {
      this.closeDropdown();
    }
  }
}