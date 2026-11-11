import type { CatalogId } from './catalog-item.model';

/** Estado que consume la interfaz actual del administrador. */
export type DeliveryZoneStatus = 'active' | 'inactive';

/**
 * Modelo normalizado para la aplicación.
 * Firestore guarda los nombres en inglés definidos para deliveryZones:
 * zoneName, shippingCost, deliveryTime, isActive y sortOrder.
 * `name` y `status` se mantienen como alias para no romper las pantallas
 * existentes de Catálogo y Productos.
 */
export interface DeliveryZone {
  id: string;
  zoneName: string;
  shippingCost?: number | null;
  deliveryTime?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;

  /** Alias de compatibilidad con los componentes actuales. */
  name: string;
  status: DeliveryZoneStatus;
  catalogId?: CatalogId;
  description?: string;
}

/** `catalogId` es opcional por compatibilidad con formularios anteriores. */
export interface DeliveryZoneInput {
  zoneName?: string;
  shippingCost?: number | null;
  deliveryTime?: string | null;
  isActive?: boolean;
  sortOrder: number;

  /** Alias de compatibilidad con formularios actuales. */
  name?: string;
  status?: DeliveryZoneStatus;
  catalogId?: CatalogId;
  description?: string;
}
