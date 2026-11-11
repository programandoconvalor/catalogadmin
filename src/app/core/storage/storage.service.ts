
import { Injectable, inject } from '@angular/core';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';

import { firebaseApp, storage } from '../firebase/firebase';
import type { CatalogId } from '../models/catalog-item.model';
import { TenantContextService } from '../tenant/tenant-context.service';

const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_FAVICON_SIZE = 1 * 1024 * 1024;

const UPLOAD_TIMEOUT_MS = 90_000;
const DOWNLOAD_URL_TIMEOUT_MS = 30_000;

const ALLOWED_IMAGES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

const MANAGED_PRODUCT_IMAGE_PATH =
  /^tenants\/[^/]+\/normal\/products\/images\/[^/]+$/;

const MANAGED_BRANDING_IMAGE_PATH =
  /^tenants\/[^/]+\/branding\/(logo|favicon)\/[^/]+$/;

export type BrandingImageType = 'logo' | 'favicon';

export interface UploadedProductImage {
  downloadUrl: string;
  fullPath: string;
}

export interface UploadedBrandingImage {
  downloadUrl: string;
  fullPath: string;
}

export interface ProductImageUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
}

export type BrandingImageUploadProgress = ProductImageUploadProgress;

export function getProductImageValidationError(
  file: File,
): string | null {
  return getImageValidationError(file, MAX_PRODUCT_IMAGE_SIZE);
}

export function getBrandingImageValidationError(
  file: File,
  type: BrandingImageType,
): string | null {
  const maxSize =
    type === 'logo' ? MAX_LOGO_SIZE : MAX_FAVICON_SIZE;

  const validationError = getImageValidationError(file, maxSize);

  if (validationError) {
    if (file.size > maxSize) {
      return type === 'logo'
        ? 'El logo no puede superar 2 MB.'
        : 'El favicon no puede superar 1 MB.';
    }

    return validationError;
  }

  return null;
}

function getImageValidationError(
  file: File,
  maxSize: number,
): string | null {
  if (!ALLOWED_IMAGES[file.type]) {
    return 'Solo se permiten imágenes JPG, PNG o WEBP.';
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !ALLOWED_IMAGES[file.type].includes(extension)) {
    return 'La extensión del archivo no coincide con su formato.';
  }

  if (file.size > maxSize) {
    return 'El archivo supera el tamaño máximo permitido.';
  }

  return null;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly tenantContext = inject(TenantContextService);

  // =========================================
  // PRODUCTOS
  // =========================================

  async uploadProductImage(
    catalogId: CatalogId,
    productCode: string,
    file: File,
    onProgress?: (progress: ProductImageUploadProgress) => void,
  ): Promise<UploadedProductImage> {
    this.validateCatalogId(catalogId);

    const validationError = getProductImageValidationError(file);

    if (validationError) {
      throw new Error(validationError);
    }

    const tenantId = this.requireTenantId();

    const safeCode =
      productCode
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';

    const extension =
      file.name.split('.').pop()?.toLowerCase() ?? 'jpg';

    const fullPath =
      `tenants/${tenantId}/${catalogId}/products/images/` +
      `${safeCode}-${this.generateUniqueSuffix()}.${extension}`;

    return this.uploadFile(
      fullPath,
      file,
      {
        tenantId,
        catalogId,
        productCode: safeCode,
      },
      onProgress,
    );
  }

  async deleteProductImage(imageUrl: string): Promise<boolean> {
    const fullPath = this.getManagedProductImagePath(imageUrl);

    if (!fullPath) {
      return false;
    }

    await this.deleteProductImageByPath(fullPath);

    return true;
  }

  async deleteProductImageByPath(fullPath: string): Promise<void> {
    if (!MANAGED_PRODUCT_IMAGE_PATH.test(fullPath)) {
      throw new Error(
        'La ruta de la imagen no pertenece al catálogo de productos.',
      );
    }

    await deleteObject(ref(storage, fullPath));
  }

  // =========================================
  // LOGO Y FAVICON
  // =========================================

  async uploadBrandingImage(
    type: BrandingImageType,
    file: File,
    onProgress?: (progress: BrandingImageUploadProgress) => void,
  ): Promise<UploadedBrandingImage> {
    if (type !== 'logo' && type !== 'favicon') {
      throw new Error('El tipo de imagen de identidad no es válido.');
    }

    const validationError = getBrandingImageValidationError(
      file,
      type,
    );

    if (validationError) {
      throw new Error(validationError);
    }

    const tenantId = this.requireTenantId();

    const extension =
      file.name.split('.').pop()?.toLowerCase() ?? 'png';

    const fullPath =
      `tenants/${tenantId}/branding/${type}/` +
      `${type}-${this.generateUniqueSuffix()}.${extension}`;

    return this.uploadFile(
      fullPath,
      file,
      {
        tenantId,
        brandingType: type,
      },
      onProgress,
    );
  }

  async deleteBrandingImage(imageUrl: string): Promise<boolean> {
    const fullPath = this.getManagedBrandingImagePath(imageUrl);

    if (!fullPath) {
      return false;
    }

    await this.deleteBrandingImageByPath(fullPath);

    return true;
  }

  async deleteBrandingImageByPath(fullPath: string): Promise<void> {
    if (!MANAGED_BRANDING_IMAGE_PATH.test(fullPath)) {
      throw new Error(
        'La ruta no pertenece a las imágenes de identidad de la florería.',
      );
    }

    const tenantId = this.requireTenantId();

    if (!fullPath.startsWith(`tenants/${tenantId}/`)) {
      throw new Error(
        'No puedes eliminar archivos pertenecientes a otra florería.',
      );
    }

    await deleteObject(ref(storage, fullPath));
  }

  // =========================================
  // SUBIDA REUTILIZABLE
  // =========================================

  private async uploadFile(
    fullPath: string,
    file: File,
    metadata: Record<string, string>,
    onProgress?: (progress: ProductImageUploadProgress) => void,
  ): Promise<UploadedProductImage> {
    const fileReference = ref(storage, fullPath);

    const uploadTask = uploadBytesResumable(
      fileReference,
      file,
      {
        contentType: file.type,
        customMetadata: metadata,
      },
    );

    let unsubscribe = () => {};
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let uploadCompleted = false;

    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const settle = (callback: () => void): void => {
          if (settled) {
            return;
          }

          settled = true;

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          unsubscribe();
          callback();
        };

        timeoutId = setTimeout(() => {
          settle(() =>
            reject(
              new Error(
                'La carga superó 90 segundos. Comprueba tu conexión e inténtalo de nuevo.',
              ),
            ),
          );

          uploadTask.cancel();
        }, UPLOAD_TIMEOUT_MS);

        unsubscribe = uploadTask.on(
          'state_changed',
          (snapshot) => {
            onProgress?.({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percent: snapshot.totalBytes
                ? Math.round(
                    (snapshot.bytesTransferred /
                      snapshot.totalBytes) *
                      100,
                  )
                : 0,
            });
          },
          (error: Error) => settle(() => reject(error)),
          () => settle(resolve),
        );
      });

      uploadCompleted = true;

      const downloadUrl =
        await this.getDownloadUrlWithTimeout(fileReference);

      return {
        downloadUrl,
        fullPath,
      };
    } catch (error) {
      console.error(
        '[StorageService] Error al subir archivo:',
        this.getSafeErrorDetails(error),
      );

      if (uploadCompleted) {
        try {
          await deleteObject(fileReference);
        } catch (cleanupError) {
          console.error(
            '[StorageService] No se pudo limpiar el archivo:',
            this.getSafeErrorDetails(cleanupError),
          );
        }
      }

      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      unsubscribe();
    }
  }

  // =========================================
  // VALIDACIÓN DE TENANT Y CATÁLOGO
  // =========================================

  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error(
        'No hay una florería activa para realizar esta operación.',
      );
    }

    return tenantId;
  }

  private validateCatalogId(
    catalogId: string,
  ): asserts catalogId is CatalogId {
    if (catalogId !== 'normal') {
      throw new Error(
        'El administrador solo permite operar sobre el catálogo.',
      );
    }
  }

  // =========================================
  // RUTAS ADMINISTRADAS
  // =========================================

  private getManagedProductImagePath(
    imageUrl: string,
  ): string | null {
    const fullPath = this.extractStoragePath(imageUrl);

    return fullPath && MANAGED_PRODUCT_IMAGE_PATH.test(fullPath)
      ? fullPath
      : null;
  }

  private getManagedBrandingImagePath(
    imageUrl: string,
  ): string | null {
    const fullPath = this.extractStoragePath(imageUrl);

    if (!fullPath || !MANAGED_BRANDING_IMAGE_PATH.test(fullPath)) {
      return null;
    }

    const tenantId = this.requireTenantId();

    return fullPath.startsWith(`tenants/${tenantId}/`)
      ? fullPath
      : null;
  }

  private extractStoragePath(imageUrl: string): string | null {
    try {
      const url = new URL(imageUrl);

      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'firebasestorage.googleapis.com'
      ) {
        return null;
      }

      const segments = url.pathname.split('/').filter(Boolean);

      if (
        segments.length < 5 ||
        segments[0] !== 'v0' ||
        segments[1] !== 'b' ||
        segments[2] !== firebaseApp.options.storageBucket ||
        segments[3] !== 'o'
      ) {
        return null;
      }

      return decodeURIComponent(segments.slice(4).join('/'));
    } catch {
      return null;
    }
  }

  // =========================================
  // UTILIDADES
  // =========================================

  private generateUniqueSuffix(): string {
    return typeof crypto !== 'undefined' &&
      'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async getDownloadUrlWithTimeout(
    fileReference: ReturnType<typeof ref>,
  ): Promise<string> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        getDownloadURL(fileReference),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () =>
              reject(
                new Error(
                  'No se obtuvo la URL de descarga dentro de 30 segundos.',
                ),
              ),
            DOWNLOAD_URL_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private getErrorCode(error: unknown): string | undefined {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return error.code;
    }

    return undefined;
  }

  private getSafeErrorDetails(error: unknown): {
    code?: string;
    message: string;
  } {
    return {
      code: this.getErrorCode(error),
      message:
        error instanceof Error ? error.message : String(error),
    };
  }
}
