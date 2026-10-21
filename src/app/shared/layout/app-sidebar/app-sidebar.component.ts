
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';

import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarService } from '../../services/sidebar.service';
import { SidebarWidgetComponent } from './app-sidebar-widget.component';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
  }[];
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
    SidebarWidgetComponent,
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41421 14.5858 9.75 15 9.75H18.5C18.9142 9.75 19.25 9.41421 19.25 9V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`,
      name: 'Dashboard',
      subItems: [
        {
          name: 'Inicio',
          path: '/',
        },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V3.75H15.25V2.75C15.25 2.33579 15.5858 2 16 2C16.4142 2 16.75 2.33579 16.75 2.75V3.75H18.5C19.7426 3.75 20.75 4.75736 20.75 6V9V19C20.75 20.2426 19.7426 21.25 18.5 21.25H5.5C4.25736 21.25 3.25 20.2426 3.25 19V9V6C3.25 4.75736 4.25736 3.75 5.5 3.75H7.25V2.75C7.25 2.33579 7.58579 2 8 2ZM8 5.25H5.5C5.08579 5.25 4.75 5.58579 4.75 6V8.25H19.25V6C19.25 5.58579 18.9142 5.25 18.5 5.25H16H8ZM19.25 9.75H4.75V19C4.75 19.4142 5.08579 19.75 5.5 19.75H18.5C18.9142 19.75 19.25 19.4142 19.25 19V9.75Z" fill="currentColor"></path></svg>`,
      name: 'Catálogos',
      subItems: [
        {
          name: 'Catálogo Normal',
          path: '/catalogs/normal',
        },
        {
          name: 'Catálogo VIP',
          path: '/catalogs/vip',
        },
      ],
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.75L19.5 6.5V17.5L12 21.25L4.5 17.5V6.5L12 2.75ZM6 7.42705V16.5729L11.25 19.1979V10.0521L6 7.42705ZM12.75 10.0521V19.1979L18 16.5729V7.42705L12.75 10.0521ZM7.67705 6.58852L12 8.75L16.3229 6.58852L12 4.42705L7.67705 6.58852Z" fill="currentColor"></path></svg>`,
      name: 'Productos',
      path: '/products',
    },
    {
      // Corrected the invalid path data in the Categories icon.
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.75 3.25C3.92157 3.25 3.25 3.92157 3.25 4.75V19.25C3.25 20.0784 3.92157 20.75 4.75 20.75H19.25C20.0784 20.75 20.75 20.0784 20.75 19.25V4.75C20.75 3.92157 20.0784 3.25 19.25 3.25H4.75ZM4.75 4.75H19.25V19.25H4.75V4.75ZM7.25 7.25C6.83579 7.25 6.5 7.58579 6.5 8C6.5 8.41421 6.83579 8.75 7.25 8.75H16.75C17.1642 8.75 17.5 8.41421 17.5 8C17.5 8.41421 17.1642 8.75 16.75 8.75H7.25ZM7.25 11.25C6.83579 11.25 6.5 11.5858 6.5 12C6.5 12.4142 6.83579 12.75 7.25 12.75H16.75C17.1642 12.75 17.5 12.4142 17.5 12C17.5 11.5858 17.1642 11.25 16.75 11.25H7.25ZM7.25 15.25C6.83579 15.25 6.5 15.5858 6.5 16C6.5 16.4142 6.83579 16.75 7.25 16.75H13.75C14.1642 16.75 14.5 16.4142 14.5 16C14.5 15.5858 14.1642 15.25 13.75 15.25H7.25Z" fill="currentColor"></path></svg>`,
      name: 'Categorías',
      path: '/categories',
    },
  ];

  othersItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5ZM12 7C10.8954 7 10 7.89543 10 9C10 10.1046 10.8954 11 12 11C13.1046 11 14 10.1046 14 9C14 7.89543 13.1046 7 12 7ZM7 17C7.55228 14.7909 9.55228 13 12 13C14.4477 13 16.4477 14.7909 17 17H7Z" fill="currentColor"></path></svg>`,
      name: 'Usuarios',
      path: '/users',
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.4858 2H13.5182C14.7519 2 15.7518 3.00019 15.7518 4.23399C15.7518 4.79884 16.3635 5.15215 16.853 4.86955C17.9215 4.25263 19.288 4.61859 19.905 5.68725L21.421 8.31303C22.0378 9.38146 21.6718 10.7477 20.6034 11.3645C20.1141 11.647 20.1141 12.3531 20.6034 12.6355C21.6718 13.2524 22.0378 14.6186 21.421 15.687L19.905 18.3128C19.288 19.3814 17.9215 19.7474 16.853 19.1305C16.3635 18.8479 15.7518 19.2012 15.7518 19.766C15.7518 20.9998 14.7519 22 13.5182 22H10.4858C9.25201 22 8.25182 20.9998 8.25182 19.766C8.25182 19.2012 7.64015 18.8479 7.15067 19.1305C6.08215 19.7474 4.71562 19.3814 4.09863 18.3128L2.58263 15.687C1.96578 14.6186 2.33184 13.2524 3.40026 12.6355C3.88947 12.353 3.88947 11.647 3.40026 11.3645C2.33184 10.7477 1.96578 9.38146 2.58263 8.31303L4.09863 5.68725C4.71562 4.61859 6.08215 4.25263 7.15067 4.86955C7.64015 5.15215 8.25182 4.79884 8.25182 4.23399C8.25182 3.00019 9.25201 2 10.4858 2ZM10.4858 3.5C9.77311 3.5 9.75182 3.82862 9.75182 4.23399C9.75182 5.9539 7.88982 7.02836 6.40065 6.16858C6.04943 5.96581 5.60034 6.08617 5.39764 6.43725L3.88165 9.06303C3.67901 9.41401 3.79926 9.86282 4.15025 10.0655C5.63946 10.9253 5.63949 13.0748 4.15026 13.9346C3.79928 14.1372 3.67903 14.586 3.88167 14.937L5.39767 17.5628C5.60037 17.9139 6.04945 18.0342 6.40067 17.8314C7.88983 16.9717 9.75182 18.0461 9.75182 19.766C9.75182 20.1714 10.0804 20.5 10.4858 20.5H13.5182C13.9233 20.5 14.2518 20.1715 14.2518 19.7663C14.2518 18.0471 16.1129 16.9721 17.602 17.8318C17.9528 18.0344 18.4013 17.9142 18.6039 17.5634L20.1203 14.9369C20.3229 14.5859 20.2026 14.1372 19.8517 13.9345C18.3625 13.0747 18.3625 10.9253 19.8517 10.0655C20.2027 9.86286 20.3229 9.41407 20.1203 9.0631L18.6039 6.43725C18.4013 6.08617 17.9528 5.96581 17.602 6.16858C16.1129 7.02836 14.2518 5.9539 14.2518 4.23399C14.2518 3.82862 13.9233 3.5 13.5182 3.5H10.4858Z" fill="currentColor"></path></svg>`,
      name: 'Configuración',
      path: '/settings',
    },
  ];

  openSubmenu: string | null | number = null;

  subMenuHeights: {
    [key: string]: number;
  } = {};

  @ViewChildren('subMenu')
  subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();
  private readonly failedTenantLogoUrl = signal<string | null>(null);

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private tenantContextService: TenantContextService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  readonly tenantName = computed(
    () =>
      this.tenantContextService.context$()?.tenant.name.trim() ||
      'Florería',
  );
  readonly tenantLogoUrl = computed(() => {
    const logoUrl =
      this.tenantContextService.context$()?.tenant.logoUrl?.trim();

    return logoUrl && logoUrl !== this.failedTenantLogoUrl()
      ? logoUrl
      : null;
  });

  onTenantLogoError() {
    const logoUrl =
      this.tenantContextService.tenant?.logoUrl?.trim();

    if (logoUrl) {
      this.failedTenantLogoUrl.set(logoUrl);
    }
  }

  ngOnInit(): void {
    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    this.subscription.add(
      combineLatest([
        this.isExpanded$,
        this.isMobileOpen$,
        this.isHovered$,
      ]).subscribe(([isExpanded, isMobileOpen, isHovered]) => {
        if (!isExpanded && !isMobileOpen && !isHovered) {
          this.cdr.detectChanges();
        }
      })
    );

    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number): void {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const element = document.getElementById(key);

        if (element) {
          this.subMenuHeights[key] = element.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSidebarMouseEnter(): void {
    this.isExpanded$
      .subscribe((expanded) => {
        if (!expanded) {
          this.sidebarService.setHovered(true);
        }
      })
      .unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string): void {
    const menuGroups = [
      {
        items: this.navItems,
        prefix: 'main',
      },
      {
        items: this.othersItems,
        prefix: 'others',
      },
    ];

    menuGroups.forEach((group) => {
      group.items.forEach((nav, index) => {
        if (!nav.subItems) {
          return;
        }

        nav.subItems.forEach((subItem) => {
          if (currentUrl === subItem.path) {
            const key = `${group.prefix}-${index}`;
            this.openSubmenu = key;

            setTimeout(() => {
              const element = document.getElementById(key);

              if (element) {
                this.subMenuHeights[key] = element.scrollHeight;
                this.cdr.detectChanges();
              }
            });
          }
        });
      });
    });
  }

  onSubmenuClick(): void {
    this.isMobileOpen$
      .subscribe((isMobile) => {
        if (isMobile) {
          this.sidebarService.setMobileOpen(false);
        }
      })
      .unsubscribe();
  }
}
