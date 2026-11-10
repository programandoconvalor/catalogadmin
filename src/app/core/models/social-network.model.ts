import type { CatalogId } from './catalog-item.model';

export const SOCIAL_NETWORK_CATALOG_ID: CatalogId = 'normal';

export type StoreSocialNetworkId =
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'tiktok'
  | 'youtube';

export type EditableSocialNetworkId = StoreSocialNetworkId;

export type StoreSocialNetworkStatus = 'active' | 'inactive';

export interface StoreSocialNetwork {
  catalogId?: CatalogId;
  network: StoreSocialNetworkId;
  url: string;
  sortOrder?: number;
  status?: StoreSocialNetworkStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ManagedStoreSocialNetwork extends StoreSocialNetwork {
  id: string;
  catalogId: CatalogId;
  sortOrder: number;
  status: StoreSocialNetworkStatus;
}

export const SOCIAL_NETWORKS: Array<{
  id: StoreSocialNetworkId;
  label: string;
  icon: string;
  color: string;
}> = [
  { id: 'facebook', label: 'Facebook', icon: 'f', color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: '◎', color: '#E4405F' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '◉', color: '#25D366' },
  { id: 'tiktok', label: 'TikTok', icon: '♪', color: '#111827' },
  { id: 'youtube', label: 'YouTube', icon: '▶', color: '#FF0000' },
];
