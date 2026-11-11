
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
import type { BrandingIdentity } from '../../../core/models/branding-identity.model';

@Component({
  selector: 'app-header',
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

  private readonly identity = signal<BrandingIdentity | null>(null);
  private readonly failedLogoUrl = signal<string | null>(null);

  readonly tenantName = computed(() => {
    const identityName = this.identity()?.storeName?.trim();

    return (
      identityName ||
      this.tenantContextService.context$()?.tenant.name.trim() ||
      'Florería'
    );
  });

  readonly tenantLogoUrl = computed(() => {
    const logoUrl = this.identity()?.logoUrl?.trim();

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

  async ngOnInit(): Promise<void> {
    await this.loadBrandingIdentity();
  }

  /**
   * Obtiene el logo y nombre desde:
   * tenants/{tenantId}/branding/identity
   */
  private async loadBrandingIdentity(): Promise<void> {
    try {
      const identity =
        await this.brandingIdentityService.getIdentity();

      this.identity.set(identity);
      this.failedLogoUrl.set(null);
    } catch (error) {
      console.error(
        'Error al cargar la identidad de marca del encabezado:',
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
   * se muestra el icono predeterminado del HTML.
   */
  onTenantLogoError(): void {
    const logoUrl = this.identity()?.logoUrl?.trim();

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
