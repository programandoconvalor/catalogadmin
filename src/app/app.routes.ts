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
import { ProductsComponent } from './pages/products/products.component';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  // =========================================================
  // PRIVATE / PROTECTED ROUTES
  // =========================================================
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      // =====================================================
      // CATALOGS
      // =====================================================
      {
        path: 'catalogs',
        children: [
          {
            path: 'products',
            component: ProductsComponent,
            title: 'Productos',
          },
          {
            path: 'normal',
            component: CatalogPageComponent,
            data: { catalogId: 'normal' },
            title: 'Catálogo Normal',
          },
          {
            path: 'vip',
            component: CatalogPageComponent,
            data: { catalogId: 'vip' },
            title: 'Catálogo VIP',
          },
        ],
      },

      // =====================================================
      // DASHBOARD
      // =====================================================
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Administración de Catálogos para Florerías',
      },

      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Calendario',
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Perfil',
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Elementos de formulario',
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Tablas',
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Página en blanco',
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Facturas',
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Gráfica de líneas',
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Gráfica de barras',
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Alertas',
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Avatares',
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Insignias',
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Botones',
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Imágenes',
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Videos',
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
    title: 'Iniciar sesión',
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [guestGuard],
    title: 'Registro',
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'Recuperar contraseña',
  },

  // =========================================================
  // 404
  // =========================================================
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Página no encontrada',
  },
];