
import { Routes } from '@angular/router';

import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
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

// CATALOG
import { CatalogPageComponent } from './pages/catalog/catalog-page.component';
import { ProductsComponent } from './pages/products/products.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { SocialNetworksComponent } from './pages/social-networks/social-networks.component';
import { PaymentMethodsComponent } from './pages/payment-methods/payment-methods.component';
import { BrandingComponent } from './pages/branding/branding.component';
import { ContactComponent } from './pages/contact/contact.component';
import { DeliveryZonesComponent } from './pages/delivery-zones/delivery-zones/delivery-zones.component';
import { LocationComponent } from './pages/location/location.component';
import { ConfigurationComponent } from './pages/configuration/configuration.component';

// AUTH
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
      // CATALOG
      // =====================================================
      {
        path: 'catalog',
        component: CatalogPageComponent,
        title: 'Catálogo',
      },
      {
        path: 'catalog/products',
        component: ProductsComponent,
        title: 'Productos',
      },
      {
        path: 'catalog/categories',
        component: CategoriesComponent,
        title: 'Categorías',
      },
      {
        path: 'catalog/social-networks',
        component: SocialNetworksComponent,
        title: 'Redes Sociales',
      },
      {
        path: 'catalog/payment-methods',
        component: PaymentMethodsComponent,
        title: 'Métodos de pago',
      },
      {
        path: 'catalog/contact',
        component: ContactComponent,
        title: 'Contacto',
      },
      {
        path: 'catalog/delivery-zones',
        component: DeliveryZonesComponent,
        title: 'Entregas y Envíos',
      },
      {
        path: 'catalog/location',
        component: LocationComponent,
        title: 'Ubicación',
      },
      {
        path: 'catalog/configuration',
        component: ConfigurationComponent,
        title: 'Configuración',
      },

      // =====================================================
      // BRANDING
      // =====================================================
      {
        path: 'catalog/branding',
        component: BrandingComponent,
        title: 'Logo y Nombre',
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
