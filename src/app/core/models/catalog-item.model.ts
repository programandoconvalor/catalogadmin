
export type CatalogId = 'normal' | 'vip';

export type CatalogItemStatus = 'active' | 'inactive';

export type ProductVariantId = 'aire' | 'helio';

export type CatalogProductBadge =
  | 'new'
  | 'customized'
  | 'specialDay'
  | 'bestSeller'
  | null
  | '';

/**
 * Variante de producto, por ejemplo:
 * Con aire / Con helio.
 */
export interface CatalogProductSizeOption {
  id: ProductVariantId;
  priceMxn: number;
  buttonLabel: string;
  titleLabel: string;
  images: string[];
}

/**
 * Tamaño o presentación del arreglo:
 * Estándar, Premium, Luxury, etc.
 */
export interface CatalogProductSize {
  id: string;
  label: string;
  priceMxn: number;
  subtitle: string;
}

export interface CatalogProductMenuAssignment {
  groupId: string;
  subcategory: string;
}

/**
 * Configuración visual que utilizan las tarjetas
 * del catálogo público.
 */
export interface CatalogProductUi {
  showBadge: boolean;
  showDeliveryDate: boolean;
  showColorDots: boolean;
  showProductSizes?: boolean;
  showStandard?: boolean;
  showPremium?: boolean;
  showLuxury?: boolean;
}

/**
 * Información comercial utilizada por el catálogo público.
 * Se guarda dentro del documento del producto en Firestore.
 */
export interface CatalogProductCommercialData {
  id: number;
  categoryId: string;

  titleTemplate?: string;
  baseTitle: string;
  subtitle?: string;
  badgeLabel?: string;

  defaultVariantId?: ProductVariantId;
  basePriceMxn: number;

  defaultImages: string[];
  activeSizeOptions: CatalogProductSizeOption[];
  productSizes?: CatalogProductSize[];

  colorDots: string[];
  badge: CatalogProductBadge;
  deliveryMessage?: string;

  description?: string;
  includes?: string[];
  deliveryZones?: string[];
  isAvailable?: boolean;

  sku: string;
  menuAssignments: CatalogProductMenuAssignment[];
  ui: CatalogProductUi;
}

/**
 * Documento general almacenado en Firestore.
 */
export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  description: string;

  imageUrl?: string;
  price: number;
  categoryId?: string;

  status: CatalogItemStatus;
  sortOrder: number;

  commercialData?: CatalogProductCommercialData;

  schemaVersion?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Datos enviados por el formulario al crear o actualizar
 * un producto. El ID y las fechas los administra el servicio.
 */
export type CatalogItemInput = Omit<
  CatalogItem,
  'id' | 'createdAt' | 'updatedAt'
>;
