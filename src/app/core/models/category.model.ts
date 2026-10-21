import type { CatalogId } from './catalog-item.model';

export type CategoryStatus = 'active' | 'inactive';

export interface Category {
  id: string;
  catalogId: CatalogId;
  name: string;
  status: CategoryStatus;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CategoryInput =
  Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
