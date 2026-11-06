
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
      name: 'Logo y Nombre',
      path: '/profile',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
    },
    {
      name: 'Categorías',
      path: '/catalogs/normal',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="7.5" r=".5"/></svg>`,
    },
    {
  name: 'Productos',
  path: '/catalogs/products',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.3 7.6 7.7 4.3 7.7-4.3M12 21v-9.1M8 5.2l8 4.5"/></svg>`,
},
    {
      name: 'Redes Sociales',
      path: '/profile',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/></svg>`,
    },
    {
      name: 'Contacto',
      path: '/profile',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.9L7.7 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.9-.6l2.8.5a2 2 0 0 1 1.7 2.6Z"/></svg>`,
    },
    {
      name: 'Entregas y Envíos',
      path: '/profile',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/></svg>`,
    },
    {
      name: 'Ubicación',
      path: '/profile',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/></svg>`,
    },
    {
      name: 'Métodos de Pago',
      path: '/profile',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20m-15 5h3"/></svg>`,
    },
    {
      name: 'Configuración',
      path: '/profile',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z"/></svg>`,
    },
  ];

  othersItems: NavItem[] = [];

  // Control del elemento seleccionado.
  activeMenuItem: string | null = null;

  // Control del menú desplegable.
  openSubmenu: string | null = null;

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

  onTenantLogoError(): void {
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
          this.setActiveMenuFromRoute(event.urlAfterRedirects);
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

  /**
   * Comprueba si una opción específica está seleccionada.
   * Compara por nombre, no por URL, porque temporalmente
   * varias opciones comparten la misma ruta.
   */
  isActive(name: string): boolean {
    return this.activeMenuItem === name;
  }

  /**
   * Selecciona exclusivamente una opción del menú.
   */
  selectMenuItem(name: string): void {
    this.activeMenuItem = name;
  }

  /**
   * Controla la apertura y cierre de submenús.
   */
  toggleSubmenu(section: string, index: number): void {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
      return;
    }

    this.openSubmenu = key;

    setTimeout(() => {
      const element = document.getElementById(key);

      if (element) {
        this.subMenuHeights[key] = element.scrollHeight;
        this.cdr.detectChanges();
      }
    });
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

  /**
   * Sincroniza el menú desplegable con la ruta.
   *
   * No selecciona opciones individuales por URL porque
   * varias comparten temporalmente /profile y /catalogs/normal.
   * La selección individual se controla mediante selectMenuItem().
   */
  private setActiveMenuFromRoute(currentUrl: string): void {
  const cleanUrl = currentUrl.split('?')[0].split('#')[0];

  // Rutas que identifican una opción única del menú.
  const routeMenuMap: Record<string, string> = {
    '/catalogs/products': 'Productos',
  };

  const activeItem = routeMenuMap[cleanUrl];

  if (activeItem) {
    this.activeMenuItem = activeItem;
  }

  // Conservamos el comportamiento de los submenús existentes.
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

      const hasActiveSubItem = nav.subItems.some(
        (subItem) => cleanUrl === subItem.path,
      );

      if (!hasActiveSubItem) {
        return;
      }

      const key = `${group.prefix}-${index}`;

      this.openSubmenu = key;

      setTimeout(() => {
        const element = document.getElementById(key);

        if (element) {
          this.subMenuHeights[key] = element.scrollHeight;
          this.cdr.detectChanges();
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
