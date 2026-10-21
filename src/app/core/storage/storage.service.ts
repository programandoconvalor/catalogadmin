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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 90_000;
const DOWNLOAD_URL_TIMEOUT_MS = 30_000;
const ALLOWED_IMAGES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};
const MANAGED_IMAGE_PATH =
  /^tenants\/[^/]+\/catalogs\/(normal|vip)\/products\/images\/[^/]+$/;

export function getProductImageValidationError(file: File): string | null {
  if (!ALLOWED_IMAGES[file.type]) {
    return 'Solo se permiten imágenes JPG, PNG o WEBP.';
  }

  const extension = file.name.split('.').pop()?.toLocaleLowerCase();
  if (!extension || !ALLOWED_IMAGES[file.type].includes(extension)) {
    return 'Solo se permiten imágenes JPG, PNG o WEBP.';
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return 'La imagen no puede superar 5 MB.';
  }

  return null;
}

export interface UploadedProductImage {
  downloadUrl: string;
  fullPath: string;
}

export interface ProductImageUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly tenantContext = inject(TenantContextService);

  async uploadProductImage(
    catalogId: CatalogId,
    productCode: string,
    file: File,
    onProgress?: (progress: ProductImageUploadProgress) => void,
  ): Promise<UploadedProductImage> {
    const validationError = getProductImageValidationError(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const tenantId = this.tenantContext.tenantId;
    if (!tenantId?.trim()) {
      throw new Error('No hay un tenant activo para subir la imagen.');
    }

    const safeCode =
      productCode.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
      || 'product';
    const extension = file.name.split('.').pop()?.toLocaleLowerCase() ?? 'jpg';
    const uniqueSuffix =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const fullPath =
      `tenants/${tenantId}/catalogs/${catalogId}/products/images/` +
      `${safeCode}-${uniqueSuffix}.${extension}`;
    const fileReference = ref(storage, fullPath);

    console.info('[StorageService] Inicia carga de imagen:', {
      catalogId,
      sizeBytes: file.size,
      contentType: file.type,
    });

    const uploadTask = uploadBytesResumable(fileReference, file, {
      contentType: file.type,
      customMetadata: {
        tenantId,
        catalogId,
        productCode: safeCode,
      },
    });

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
                'La carga de imagen superó 90 segundos. Comprueba la conexión e inténtalo de nuevo.',
              ),
            ),
          );
          uploadTask.cancel();
        }, UPLOAD_TIMEOUT_MS);

        unsubscribe = uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: ProductImageUploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percent: snapshot.totalBytes
                ? Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                  )
                : 0,
            };
            onProgress?.(progress);
          },
          (error: Error) => settle(() => reject(error)),
          () => settle(resolve),
        );
      });

      uploadCompleted = true;
      console.info('[StorageService] Carga de imagen completada:', {
        catalogId,
        sizeBytes: file.size,
      });

      const downloadUrl = await this.getDownloadUrlWithTimeout(fileReference);
      console.info('[StorageService] URL de imagen obtenida:', { catalogId });
      return { downloadUrl, fullPath };
    } catch (downloadError) {
      console.error(
        '[StorageService] Falló la carga o lectura de la imagen:',
        this.getSafeErrorDetails(downloadError),
      );

      if (!uploadCompleted) {
        throw downloadError;
      }

      try {
        await deleteObject(fileReference);
      } catch (cleanupError) {
        if (this.getErrorCode(cleanupError) === 'storage/object-not-found') {
          throw downloadError;
        }
        console.error(
          '[StorageService] Falló la limpieza de la imagen sin URL descargable:',
          this.getSafeErrorDetails(cleanupError),
        );
        throw new Error(
          `No se pudo finalizar la carga de imagen (${this.describeError(downloadError)}) y tampoco limpiar el archivo nuevo (${this.describeError(cleanupError)}).`,
        );
      }

      throw downloadError;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    }
  }

  async deleteProductImage(imageUrl: string): Promise<boolean> {
    const fullPath = this.getManagedImagePath(imageUrl);

    if (!fullPath) {
      return false;
    }

    await this.deleteProductImageByPath(fullPath);
    return true;
  }

  async deleteProductImageByPath(fullPath: string): Promise<void> {
    if (!MANAGED_IMAGE_PATH.test(fullPath)) {
      throw new Error('La ruta de la imagen no pertenece al catálogo de productos.');
    }

    await deleteObject(ref(storage, fullPath));
  }

  private getManagedImagePath(imageUrl: string): string | null {
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

      const fullPath = decodeURIComponent(segments.slice(4).join('/'));
      return MANAGED_IMAGE_PATH.test(fullPath) ? fullPath : null;
    } catch {
      return null;
    }
  }

  private describeError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(
      /(https:\/\/firebasestorage\.googleapis\.com\/[^\s?]+)\?[^\s]+/g,
      '$1?[redacted]',
    );
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
      message: this.describeError(error),
    };
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
}
