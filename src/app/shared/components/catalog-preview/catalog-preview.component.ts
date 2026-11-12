
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { BrandingIdentityService } from '../../../core/branding/branding-identity.service';
import { CatalogService } from '../../../core/catalog/catalog.service';
import { CategoryService } from '../../../core/catalog/category.service';
import { CatalogSettingsService } from '../../../core/catalog-settings/catalog-settings.service';

import type { BrandingIdentity } from '../../../core/models/branding-identity.model';
import type { CatalogItem } from '../../../core/models/catalog-item.model';
import type { Category } from '../../../core/models/category.model';
import type { CatalogSettings } from '../../../core/catalog-settings/catalog-settings.model';

export interface PreviewProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  imageUrl: string;
}

@Component({
  selector: 'app-catalog-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-preview.component.html',
  styleUrl: './catalog-preview.component.css',
})
export class CatalogPreviewComponent implements OnInit {
  private readonly brandingService = inject(BrandingIdentityService);
  private readonly catalogService = inject(CatalogService);
  private readonly categoryService = inject(CategoryService);
  private readonly settingsService = inject(CatalogSettingsService);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly identity = signal<BrandingIdentity | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly products = signal<PreviewProduct[]>([]);

  readonly settings = signal<CatalogSettings>({
    showSearch: true,
    showProductDetail: true,
    showProductCode: true,
    primaryColor: '#EC4899',
  });

  readonly storeName = signal('Mi florería');
  readonly tagline = signal(
    'Arreglos florales para momentos inolvidables.',
  );

  async ngOnInit(): Promise<void> {
    await this.loadPreview();
  }

  async loadPreview(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const [
        identity,
        categories,
        items,
        settings,
      ] = await Promise.all([
        this.brandingService.getIdentity(),
        this.categoryService.getCategories('normal'),
        this.catalogService.getItems('normal'),
        this.settingsService.getSettings(),
      ]);

      this.identity.set(identity);
      this.categories.set(
        categories.filter(
          (category) => category.status === 'active',
        ),
      );

      this.settings.set(settings);

      this.storeName.set(
        identity?.storeName?.trim() || 'Mi florería',
      );

      this.tagline.set(
        identity?.tagline?.trim() ||
          'Arreglos florales para momentos inolvidables.',
      );

      this.products.set(
        items
          .filter((item) => item.status === 'active')
          .map((item) => this.mapProduct(item))
          .filter((product) => Boolean(product.imageUrl))
          .slice(0, 6),
      );
    } catch (error) {
      console.error(
        '[CatalogPreviewComponent] Error al cargar la vista previa:',
        error,
      );

      this.errorMessage.set(
        'No fue posible cargar la vista previa del catálogo.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private mapProduct(item: CatalogItem): PreviewProduct {
    const commercialData = item.commercialData;

    const variantImage =
      commercialData?.activeSizeOptions
        ?.flatMap((variant) => variant.images ?? [])
        .find((image) => Boolean(image?.trim())) ?? '';

    const defaultImage =
      commercialData?.defaultImages?.find(
        (image) => Boolean(image?.trim()),
      ) ?? '';

    return {
      id: item.id,
      name:
        commercialData?.baseTitle?.trim() ||
        item.name ||
        'Producto sin nombre',
      code:
        commercialData?.sku?.trim() ||
        item.code ||
        '',
      price:
        commercialData?.basePriceMxn ??
        item.price ??
        0,
      imageUrl:
        defaultImage ||
        variantImage ||
        item.imageUrl ||
        '',
    };
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  async retry(): Promise<void> {
    await this.loadPreview();
  }
}
