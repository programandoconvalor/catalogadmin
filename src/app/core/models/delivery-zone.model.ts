import type { CatalogId } from './catalog-item.model';

export type DeliveryZoneStatus = 'active' | 'inactive';

export interface DeliveryZone {
  id: string;
  catalogId: CatalogId;
  name: string;
  status: DeliveryZoneStatus;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DeliveryZoneInput {
  catalogId: CatalogId;
  name: string;
  status: DeliveryZoneStatus;
  sortOrder: number;
}
