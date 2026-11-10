import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import type { DocumentData } from 'firebase/firestore';
import type {
  CatalogId,
  CatalogItem,
  CatalogItemInput,
} from '../models/catalog-item.model';

import {
  mapCatalogItem,
  normalizeCatalogIncludes,
} from './catalog-item.mapper';
import { db } from '../firebase/firebase';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly tenantContext = inject(TenantContextService);

  async getItems(catalogId: CatalogId): Promise<CatalogItem[]> {
    const snapshot = await getDocs(this.itemsCollection(catalogId));

    return snapshot.docs
      .map((itemSnapshot) =>
        mapCatalogItem(itemSnapshot.id, itemSnapshot.data()),
      )
      .sort((first, second) => first.sortOrder - second.sortOrder);
  }

  async getItem(
    catalogId: CatalogId,
    itemId: string,
  ): Promise<CatalogItem | null> {
    // La edición debe partir siempre del documento más reciente de Firestore,
    // no de una posible copia desactualizada de la caché local.
    const snapshot = await getDocFromServer(
      this.itemDocument(catalogId, itemId),
    );

    if (!snapshot.exists()) {
      return null;
    }

    return mapCatalogItem(snapshot.id, snapshot.data());
  }

  async createItem(
    catalogId: CatalogId,
    item: CatalogItemInput,
  ): Promise<string> {
    this.validateCatalogId(catalogId);
    const tenantId = this.requireTenantId();
    const collectionPath =
      `tenants/${tenantId}/catalogs/${catalogId}/items`;
    const includes = normalizeCatalogIncludes(
      item.commercialData?.includes ?? item.includes,
    );

    const payload: DocumentData = {
      ...item,
      includes,
      commercialData: item.commercialData
        ? { ...item.commercialData, includes }
        : item.commercialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    this.removeUndefinedFields(payload);

    console.info('[CatalogService] Inicia creación en Firestore:', {
      collectionPath,
    });

    try {
      const created = await addDoc(
        this.itemsCollection(catalogId, tenantId),
        payload,
      );
      console.info('[CatalogService] Creación completada en Firestore:', {
        collectionPath,
        documentId: created.id,
      });
      return created.id;
    } catch (error) {
      console.error('[CatalogService] Falló la creación en Firestore:', {
        collectionPath,
        ...this.getSafeErrorDetails(error),
      });
      throw error;
    }

  }

  async updateItem(
    catalogId: CatalogId,
    itemId: string,
    item: Partial<CatalogItemInput>,
  ): Promise<void> {
    this.validateCatalogId(catalogId);
    const canonicalIncludes = normalizeCatalogIncludes(
      item.commercialData?.includes ?? item.includes,
    );

    const updates: DocumentData = {
      ...item,
      updatedAt: serverTimestamp(),
    };

    if (item.commercialData) {
      delete updates['commercialData'];
      for (const [field, value] of Object.entries(item.commercialData)) {
        if (value !== undefined) {
          updates[`commercialData.${field}`] = value;
        }
      }
    }

    // Mantiene sincronizado el campo raíz usado por documentos existentes
    // y commercialData.includes usado por el modelo comercial actual.
    if (
      Object.hasOwn(item, 'includes') ||
      item.commercialData?.includes !== undefined
    ) {
      // Ambos campos se escriben desde el mismo arreglo canónico.
      // Esto evita que la lectura priorice un valor raíz desactualizado.
      updates['includes'] = canonicalIncludes;
      updates['commercialData.includes'] = canonicalIncludes;
    }

    if (
      Object.hasOwn(item, 'categoryId') &&
      item.categoryId === undefined
    ) {
      updates['categoryId'] = deleteField();
    }

    if (
      Object.hasOwn(item, 'imageUrl') &&
      item.imageUrl === undefined
    ) {
      updates['imageUrl'] = deleteField();
    }

    this.removeUndefinedFields(updates);

    const tenantId = this.requireTenantId();
    const documentPath =
      `tenants/${tenantId}/catalogs/${catalogId}/items/${itemId}`;
    console.info('[CatalogService] Inicia actualización en Firestore:', {
      documentPath,
    });

    try {
      await updateDoc(
        this.itemDocument(catalogId, itemId, tenantId),
        updates,
      );
      console.info('[CatalogService] Actualización completada en Firestore:', {
        documentPath,
      });
    } catch (error) {
      console.error('[CatalogService] Falló la actualización en Firestore:', {
        documentPath,
        ...this.getSafeErrorDetails(error),
      });
      throw error;
    }
  }

  async deleteItem(
    catalogId: CatalogId,
    itemId: string,
  ): Promise<void> {
    await deleteDoc(
      this.itemDocument(catalogId, itemId),
    );
  }

  private itemsCollection(
    catalogId: CatalogId,
    tenantId = this.requireTenantId(),
  ) {
    this.validateCatalogId(catalogId);

    return collection(
      db,
      'tenants',
      tenantId,
      'catalogs',
      catalogId,
      'items',
    );
  }

  private itemDocument(
    catalogId: CatalogId,
    itemId: string,
    tenantId?: string,
  ) {
    if (!itemId.trim()) {
      throw new Error('El identificador del producto es obligatorio.');
    }

    return doc(
      this.itemsCollection(catalogId, tenantId),
      itemId,
    );
  }

  private validateCatalogId(catalogId: string): asserts catalogId is CatalogId {
    if (catalogId !== 'normal') {
      throw new Error('El administrador solo permite operar sobre el catálogo.');
    }
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error(
        'No hay un tenant activo para acceder al catálogo.',
      );
    }

    return tenantId;
  }

  private removeUndefinedFields(data: DocumentData): void {
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) {
        delete data[key];
      }
    }
  }

  private getSafeErrorDetails(error: unknown): {
    code?: string;
    message: string;
  } {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;
    const message =
      error instanceof Error ? error.message : String(error);

    return {
      code,
      message: message.replace(
        /(https:\/\/firebasestorage\.googleapis\.com\/[^\s?]+)\?[^\s]+/g,
        '$1?[redacted]',
      ),
    };
  }
}