import { Routes } from '@angular/router';

import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { CatalogPageComponent } from './pages/catalog/catalog-page.component';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  // =========================================================
  // PRIVATE / PROTECTED ROUTES
  // =========================================================
  {
    path: '',
    component: AppLayoutComponent,

    // 🔐 Todas las rutas dentro de AppLayout requieren autenticación
    canActivate: [authGuard],

    children: [
      {
        path: 'catalogs/normal',
        component: CatalogPageComponent,
        data: { catalogId: 'normal' },
        title: 'Catálogo Normal | Administración de catálogo',
      },

      {
        path: 'catalogs/vip',
        component: CatalogPageComponent,
        data: { catalogId: 'vip' },
        title: 'Catálogo VIP | Administración de catálogo',
      },

      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'calendar',
        component: CalenderComponent,
        title:
          'Angular Calendar | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'profile',
        component: ProfileComponent,
        title:
          'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'form-elements',
        component: FormElementsComponent,
        title:
          'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title:
          'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'blank',
        component: BlankComponent,
        title:
          'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'invoice',
        component: InvoicesComponent,
        title:
          'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'line-chart',
        component: LineChartComponent,
        title:
          'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'bar-chart',
        component: BarChartComponent,
        title:
          'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'alerts',
        component: AlertsComponent,
        title:
          'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'avatars',
        component: AvatarElementComponent,
        title:
          'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'badge',
        component: BadgesComponent,
        title:
          'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'buttons',
        component: ButtonsComponent,
        title:
          'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'images',
        component: ImagesComponent,
        title:
          'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },

      {
        path: 'videos',
        component: VideosComponent,
        title:
          'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
    ],
  },

  // =========================================================
  // PUBLIC / AUTH ROUTES
  // =========================================================

  {
    path: 'signin',
    component: SignInComponent,
    canActivate: [guestGuard],
    title: 'Iniciar sesión | Administración de catálogo',
  },

  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [guestGuard],
    title: 'Crear cuenta | Administración de catálogo',
  },

  // =========================================================
  // 404
  // =========================================================

  {
    path: '**',
    component: NotFoundComponent,
    title: 'Página no encontrada | Administración de catálogo',
  },
];