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
import { ResetPasswordComponent } from './pages/auth-pages/reset-password/reset-password.component';
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
        title: 'Administración de Catálogos para Florerías',
      },

      {
        path: 'catalogs/vip',
        component: CatalogPageComponent,
        data: { catalogId: 'vip' },
        title: 'Administración de Catálogos para Florerías',
      },

      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'calendar',
        component: CalenderComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'profile',
        component: ProfileComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'form-elements',
        component: FormElementsComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'blank',
        component: BlankComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'invoice',
        component: InvoicesComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'line-chart',
        component: LineChartComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'bar-chart',
        component: BarChartComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'alerts',
        component: AlertsComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'avatars',
        component: AvatarElementComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'badge',
        component: BadgesComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'buttons',
        component: ButtonsComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'images',
        component: ImagesComponent,
        title:
          'Administración de Catálogos para Florerías',
      },

      {
        path: 'videos',
        component: VideosComponent,
        title:
          'Administración de Catálogos para Florerías',
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
    title: 'Administración de Catálogos para Florerías',
  },

  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [guestGuard],
    title: 'Administración de Catálogos para Florerías',
  },

  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'Administración de Catálogos para Florerías',
  },

  // =========================================================
  // 404
  // =========================================================

  {
    path: '**',
    component: NotFoundComponent,
    title: 'Administración de Catálogos para Florerías',
  },
];