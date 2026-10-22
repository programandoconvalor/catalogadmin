export type StoreSocialNetworkId =
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'x';

export interface StorePhone {
  label: string;
  number: string;
  countryCode?: string;
}

export interface StoreSocialNetwork {
  network: StoreSocialNetworkId;
  url: string;
}

export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mapUrl: string;
  latitude: number | null;
  longitude: number | null;
}

export interface StoreProfile {
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  /** Teléfono heredado: se mantiene por compatibilidad con catálogos antiguos. */
  primaryPhone: string;
  primaryPhoneCountryCode?: string;
  /** Teléfonos independientes para los catálogos Normal y VIP. */
  primaryPhoneNormal: string;
  primaryPhoneNormalCountryCode: string;
  primaryPhoneVip: string;
  primaryPhoneVipCountryCode: string;
  /** Campo heredado; se conserva para no romper datos guardados anteriormente. */
  phones: StorePhone[];
  email: string;
  website: string;
  socials: StoreSocialNetwork[];
  address: StoreAddress;
  primaryColor: string;
  payments: string[];
  purchasePolicy: string;
  footerCredit: string;
  updatedAt?: unknown;
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
  { id: 'pinterest', label: 'Pinterest', icon: 'p', color: '#BD081C' },
  { id: 'x', label: 'X', icon: '𝕏', color: '#111827' },
];

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  name: 'Cielito de Flores',
  tagline: 'Arreglos florales para momentos inolvidables',
  description: 'Arreglos florales para momentos inolvidables. Rosas, gerberas, girasoles y más. Calidad, frescura y entregas seguras.',
  logoUrl: '',
  coverUrl: '',
  primaryPhone: '',
  primaryPhoneCountryCode: 'MX',
  primaryPhoneNormal: '',
  primaryPhoneNormalCountryCode: 'MX',
  primaryPhoneVip: '',
  primaryPhoneVipCountryCode: 'MX',
  phones: [],
  email: '',
  website: '',
  socials: [],
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'México',
    mapUrl: '',
    latitude: null,
    longitude: null,
  },
  primaryColor: '#ec4899',
  payments: ['cash', 'deposit', 'transfer'],
  purchasePolicy: 'Políticas de Compra',
  footerCredit: 'Desarrollado por Juan Carlos Zepeda',
};
