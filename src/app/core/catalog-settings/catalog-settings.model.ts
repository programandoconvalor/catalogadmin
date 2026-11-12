/**
 * Configuración visual del catálogo público.
 *
 * Firestore:
 * tenants/{tenantId}/settings/display
 */

export interface CatalogSettings {
  showSearch: boolean;
  showProductDetail: boolean;
  showProductCode: boolean;
  primaryColor: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const DEFAULT_CATALOG_SETTINGS: CatalogSettings = {
  showSearch: true,
  showProductDetail: true,
  showProductCode: true,
  primaryColor: '#EC4899',
};