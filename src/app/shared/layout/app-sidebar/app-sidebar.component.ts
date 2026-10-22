
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
      name: 'Politicas',
      path: '/policies',
    },
    
  ];

  othersItems: NavItem[] = [
    
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
