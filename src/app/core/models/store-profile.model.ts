import type { StoreSocialNetwork } from './social-network.model';

export interface StorePhone {
  label: string;
  number: string;
  countryCode?: string;
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
  /** Campo conservado por compatibilidad con los documentos existentes. */
  primaryPhoneNormal: string;
  primaryPhoneNormalCountryCode: string;
  /** Campo heredado; se conserva para no romper datos guardados anteriormente. */
  phones: StorePhone[];
  email: string;
  website: string;
  /** Campo heredado; la persistencia actual usa tenants/{tenantId}/socials/{networkId}. */
  socials: StoreSocialNetwork[];
  address: StoreAddress;
  primaryColor: string;
  payments: string[];
  purchasePolicy: string;
  footerCredit: string;
  updatedAt?: unknown;
}

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
