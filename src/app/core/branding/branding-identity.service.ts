
import { Injectable, inject, signal } from '@angular/core';

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db, storage } from '../firebase/firebase';

import type {
  BrandingIdentity,
  BrandingImageType,
  UploadedBrandingImage,
} from '../models/branding-identity.model';

import { TenantContextService } from '../tenant/tenant-context.service';

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_FAVICON_SIZE = 1 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

@Injectable({
  providedIn: 'root',
})
export class BrandingIdentityService {
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Estado privado de la identidad.
   */
  private readonly _identity = signal<BrandingIdentity | null>(null);

  /**
   * Señal compartida de solo lectura.
   *
   * Los componentes pueden consultar:
   * brandingService.identity()
   *
   * Los cambios se reflejan automáticamente.
   */
  readonly identity = this._identity.asReadonly();

  /**
   * Obtiene la identidad del tenant activo.
   *
   * Documento:
   * tenants/{tenantId}/branding/identity
   */
  async getIdentity(): Promise<BrandingIdentity | null> {
    const tenantId = this.requireTenantId();

    const identityRef = this.getIdentityRef(tenantId);

    const snapshot = await getDoc(identityRef);

    if (!snapshot.exists()) {
      this._identity.set(null);
      return null;
    }

    const identity = snapshot.data() as BrandingIdentity;

    this._identity.set(identity);

    return identity;
  }

  /**
   * Guarda la identidad en Firestore y actualiza
   * inmediatamente la señal compartida.
   */
  async saveIdentity(
    identity: Pick<
      BrandingIdentity,
      | 'storeName'
      | 'tagline'
      | 'logoUrl'
      | 'logoStoragePath'
      | 'faviconUrl'
      | 'faviconStoragePath'
    >,
  ): Promise<void> {
    const tenantId = this.requireTenantId();

    const identityRef = this.getIdentityRef(tenantId);

    const currentSnapshot = await getDoc(identityRef);

    const currentIdentity = currentSnapshot.exists()
      ? (currentSnapshot.data() as BrandingIdentity)
      : null;

    const data: Record<string, unknown> = {
      ...identity,
      updatedAt: serverTimestamp(),
    };

    if (!currentSnapshot.exists()) {
      data['createdAt'] = serverTimestamp();
    }

    await setDoc(identityRef, data, { merge: true });

    /**
     * Actualización reactiva.
     * Sidebar, Header y User Dropdown reciben
     * automáticamente los nuevos valores.
     */
    this._identity.set({
      ...currentIdentity,
      ...identity,
    } as BrandingIdentity);
  }

  /**
   * Limpia la identidad compartida.
   * Debe ejecutarse al cerrar sesión o cambiar de tenant.
   */
  clearIdentity(): void {
    this._identity.set(null);
  }

  /**
   * Sube el logo o favicon a Firebase Storage.
   */
  async uploadImage(
    type: BrandingImageType,
    file: File,
  ): Promise<UploadedBrandingImage> {
    const tenantId = this.requireTenantId();

    this.validateImage(type, file);

    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (!extension) {
      throw new Error(
        'No se pudo identificar el formato de la imagen.',
      );
    }

    const uniqueId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const fullPath =
      `tenants/${tenantId}/branding/images/` +
      `${type}-${uniqueId}.${extension}`;

    const imageRef = ref(storage, fullPath);

    await uploadBytes(imageRef, file, {
      contentType: file.type,
      customMetadata: {
        tenantId,
        imageType: type,
      },
    });

    const downloadUrl = await getDownloadURL(imageRef);

    return {
      downloadUrl,
      fullPath,
    };
  }

  /**
   * Elimina una imagen administrada por el tenant activo.
   */
  async deleteImageByPath(fullPath: string): Promise<void> {
    const tenantId = this.requireTenantId();

    const expectedPrefix =
      `tenants/${tenantId}/branding/images/`;

    if (
      typeof fullPath !== 'string' ||
      !fullPath.startsWith(expectedPrefix) ||
      fullPath.includes('..')
    ) {
      throw new Error(
        'La ruta de la imagen no pertenece a la identidad de este catálogo.',
      );
    }

    await deleteObject(ref(storage, fullPath));
  }

  /**
   * Valida formato, extensión y tamaño.
   */
  private validateImage(
    type: BrandingImageType,
    file: File,
  ): void {
    const allowedExtensions = ALLOWED_IMAGE_TYPES[file.type];

    if (!allowedExtensions) {
      throw new Error(
        'Solo se permiten imágenes JPG, PNG o WEBP.',
      );
    }

    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      throw new Error(
        'La extensión del archivo no coincide con su formato.',
      );
    }

    const maxSize =
      type === 'logo'
        ? MAX_LOGO_SIZE
        : MAX_FAVICON_SIZE;

    if (file.size > maxSize) {
      const maxSizeMb = maxSize / (1024 * 1024);

      throw new Error(
        `La imagen no puede superar ${maxSizeMb} MB.`,
      );
    }
  }

  /**
   * Referencia al documento de identidad del tenant.
   */
  private getIdentityRef(tenantId: string) {
    return doc(
      db,
      'tenants',
      tenantId,
      'branding',
      'identity',
    );
  }

  /**
   * Obtiene el tenant activo.
   */
  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error(
        'No hay una florería activa. Inicia sesión nuevamente.',
      );
    }

    return tenantId;
  }
}
