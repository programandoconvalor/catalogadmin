export interface StoreLocation {
  fullAddress: string;
  googleMapsUrl: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const DEFAULT_STORE_LOCATION: StoreLocation = {
  fullAddress: '',
  googleMapsUrl: '',
  isActive: true,
};
