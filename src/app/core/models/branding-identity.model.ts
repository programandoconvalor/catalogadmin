
export interface BrandingIdentity {
  storeName: string;
  tagline: string;

  logoUrl: string;
  logoStoragePath: string;

  faviconUrl: string;
  faviconStoragePath: string;

  createdAt?: unknown;
  updatedAt?: unknown;
}

export type BrandingImageType = 'logo' | 'favicon';

export interface UploadedBrandingImage {
  downloadUrl: string;
  fullPath: string;
}
