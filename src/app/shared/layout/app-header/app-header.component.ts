
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';

import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';

import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import { BrandingIdentityService } from '../../../core/branding/branding-identity.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    UserDropdownComponent,
  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  isApplicationMenuOpen = false;

  readonly isMobileOpen$;

  private readonly tenantContextService = inject(TenantContextService);
  private readonly brandingIdentityService = inject(BrandingIdentityService);

  /**
   * Evita mostrar una URL que ya falló al cargar.
   */
  private readonly failedLogoUrl = signal<string | null>(null);

  /**
   * Nombre de la florería.
   * La fuente principal es branding/identity.
   */
  readonly tenantName = computed(() => {
    const identityName = this.brandingIdentityService
      .identity()
      ?.storeName
      ?.trim();

    const tenantName = this.tenantContextService
      .context$()
      ?.tenant
      ?.name
      ?.trim();

    return identityName || tenantName || 'Florería';
  });

  /**
   * Logo compartido desde BrandingIdentityService.
   *
   * Al actualizar identity(), Angular actualiza
   * automáticamente el logo del Header.
   */
  readonly tenantLogoUrl = computed(() => {
    const logoUrl = this.brandingIdentityService
      .identity()
      ?.logoUrl
      ?.trim();

    if (!logoUrl || logoUrl === this.failedLogoUrl()) {
      return null;
    }

    return logoUrl;
  });

  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  constructor(public sidebarService: SidebarService) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit(): void {
    /**
     * Reutiliza la identidad compartida.
     * Solo consulta Firestore si todavía no está cargada.
     */
    if (!this.brandingIdentityService.identity()) {
      void this.loadBrandingIdentity();
    }
  }

  /**
   * Carga inicial de identidad del tenant.
   */
  private async loadBrandingIdentity(): Promise<void> {
    try {
      await this.brandingIdentityService.getIdentity();
      this.failedLogoUrl.set(null);
    } catch (error) {
      console.error(
        '[Header] Error al cargar la identidad de marca:',
        error,
      );
    }
  }

  handleToggle(): void {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }

  toggleApplicationMenu(): void {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  /**
   * Si Firebase Storage no puede cargar la imagen,
   * el HTML muestra el icono predeterminado.
   */
  onTenantLogoError(): void {
    const logoUrl = this.brandingIdentityService
      .identity()
      ?.logoUrl
      ?.trim();

    if (logoUrl) {
      this.failedLogoUrl.set(logoUrl);
    }
  }

  ngAfterViewInit(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  };
}
