
import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { DocumentData } from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { Category, CategoryInput } from '../models/category.model';
import type { CatalogId } from '../models/catalog-item.model';
import { TenantContextService } from '../tenant/tenant-context.service';
import { environment } from '../../../environments/environment';

interface CategoryCacheEntry {
  data: Category[];
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Caché aislado por tenant y catálogo.
   * Evita repetir lecturas innecesarias a Firestore.
   */
  private readonly cache = new Map<string, CategoryCacheEntry>();

  /**
   * Evita ejecutar varias consultas idénticas simultáneamente.
   */
  private readonly pendingRequests = new Map<
    string,
    Promise<Category[]>
  >();

  /**
   * Tiempo de vida del caché: 15 segundos.
   */
  private readonly cacheTtl = 15_000;
  private readonly initializedAt = performance.now();
  private initializationLogged = false;

  /**
   * Obtiene las categorías del catálogo Normal.
   */
  async getCategories(catalogId: CatalogId): Promise<Category[]> {
    this.validateCatalogId(catalogId);

    const tenantContextStartedAt = performance.now();
    const tenantId = this.requireTenantId();
    const tenantContextDurationMs =
      performance.now() - tenantContextStartedAt;
    const cacheKey = this.getCacheKey(tenantId, catalogId);

    if (!environment.production && !this.initializationLogged) {
      this.initializationLogged = true;
      console.info('[Categories Performance] Service initialization:', {
        durationMs: Math.round(performance.now() - this.initializedAt),
      });
    }

    if (!environment.production) {
      console.info('[Categories Performance] Tenant context:', {
        tenantId,
        durationMs: Math.round(tenantContextDurationMs),
      });
    }

    // 1. Consultar caché.
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      if (!environment.production) {
        console.info('[Categories Performance] In-memory cache:', {
          tenantId,
          total: cached.data.length,
          durationMs: Math.round(performance.now() - tenantContextStartedAt),
        });
      }

      return [...cached.data];
    }

    // 2. Reutilizar una petición que ya esté en ejecución.
    const pending = this.pendingRequests.get(cacheKey);

    if (pending) {
      return pending;
    }

    // 3. Consultar Firestore.
    const request = this.fetchCategories(
      tenantId,
      catalogId,
      cacheKey,
      tenantContextDurationMs,
    );

    this.pendingRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      if (this.pendingRequests.get(cacheKey) === request) {
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  /**
   * Obtiene las categorías directamente desde Firestore.
   */
  private async fetchCategories(
    tenantId: string,
    catalogId: CatalogId,
    cacheKey: string,
    tenantContextDurationMs: number,
  ): Promise<Category[]> {
    const collectionRef = collection(
      db,
      'tenants',
      tenantId,
      'categories',
    );

    const categoriesQuery = query(
      collectionRef,
      where('catalogId', '==', catalogId),
    );

    const queryStartedAt = performance.now();

    try {
      const snapshot = await getDocs(categoriesQuery);
      const queryDurationMs = performance.now() - queryStartedAt;
      const mappingStartedAt = performance.now();

      const categories = snapshot.docs
        .map((categorySnapshot) => {
          const data = categorySnapshot.data();

          return {
            ...data,
            id: categorySnapshot.id,
          } as Category;
        })
        .sort(
          (first, second) =>
            (first.sortOrder ?? 0) - (second.sortOrder ?? 0),
        );
      const mappingDurationMs = performance.now() - mappingStartedAt;

      // Guardar resultado en caché.
      this.cache.set(cacheKey, {
        data: categories,
        expiresAt: Date.now() + this.cacheTtl,
      });

      if (!environment.production) {
        console.info('[Categories Performance] Firestore query:', {
          tenantId,
          catalogId,
          path: `tenants/${tenantId}/categories`,
          total: categories.length,
          durationMs: Math.round(queryDurationMs),
          fromCache: snapshot.metadata.fromCache,
        });
        console.info('[Categories Performance] Data mapping:', {
          total: categories.length,
          durationMs: Math.round(mappingDurationMs),
        });
        console.info('[Categories Performance] Service total:', {
          tenantContextDurationMs: Math.round(tenantContextDurationMs),
          queryDurationMs: Math.round(queryDurationMs),
          mappingDurationMs: Math.round(mappingDurationMs),
          durationMs: Math.round(performance.now() - queryStartedAt),
        });
      }

      return [...categories];
    } catch (error) {
      console.error('[CategoryService] Error al consultar categorías:', {
        tenantId,
        catalogId,
        durationMs: Math.round(performance.now() - queryStartedAt),
        error,
      });

      throw error;
    }
  }

  /**
   * Crear categoría.
   */
  async createCategory(category: CategoryInput): Promise<string> {
    this.validateCatalogId(category.catalogId);

    const tenantId = this.requireTenantId();

    const payload: DocumentData = {
      ...category,
      catalogId: 'normal',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    this.removeUndefinedFields(payload);

    try {
      const created = await addDoc(
        this.categoriesCollection(tenantId),
        payload,
      );

      this.invalidateCache(tenantId);

      if (!environment.production) {
        console.info('[CategoryService] Categoría creada:', {
          tenantId,
          categoryId: created.id,
        });
      }

      return created.id;
    } catch (error) {
      console.error('[CategoryService] Error creando categoría:', error);
      throw error;
    }
  }

  /**
   * Actualizar categoría.
   */
  async updateCategory(
    categoryId: string,
    category: Partial<CategoryInput>,
  ): Promise<void> {
    this.validateDocumentId(categoryId);

    if (category.catalogId !== undefined) {
      this.validateCatalogId(category.catalogId);
    }

    const tenantId = this.requireTenantId();

    const categoryRef = doc(
      this.categoriesCollection(tenantId),
      categoryId,
    );

    try {
      const existing = await getDoc(categoryRef);

      if (!existing.exists()) {
        throw new Error('La categoría no existe.');
      }

      if (existing.data()['catalogId'] !== 'normal') {
        throw new Error(
          'El administrador solo permite modificar categorías del catálogo.',
        );
      }

      const updates: DocumentData = {
        ...category,
        updatedAt: serverTimestamp(),
      };

      this.removeUndefinedFields(updates);

      await updateDoc(categoryRef, updates);

      this.invalidateCache(tenantId);

      if (!environment.production) {
        console.info('[CategoryService] Categoría actualizada:', {
          tenantId,
          categoryId,
        });
      }
    } catch (error) {
      console.error('[CategoryService] Error actualizando categoría:', error);
      throw error;
    }
  }

  /**
   * Eliminar categoría.
   */
  async deleteCategory(categoryId: string): Promise<void> {
    this.validateDocumentId(categoryId);

    const tenantId = this.requireTenantId();

    const categoryRef = doc(
      this.categoriesCollection(tenantId),
      categoryId,
    );

    try {
      const existing = await getDoc(categoryRef);

      if (!existing.exists()) {
        throw new Error('La categoría no existe.');
      }

      if (existing.data()['catalogId'] !== 'normal') {
        throw new Error(
          'El administrador solo permite eliminar categorías del catálogo.',
        );
      }

      await deleteDoc(categoryRef);

      this.invalidateCache(tenantId);

      if (!environment.production) {
        console.info('[CategoryService] Categoría eliminada:', {
          tenantId,
          categoryId,
        });
      }
    } catch (error) {
      console.error('[CategoryService] Error eliminando categoría:', error);
      throw error;
    }
  }

  /**
   * Colección de categorías del tenant actual.
   */
  private categoriesCollection(tenantId = this.requireTenantId()) {
    return collection(
      db,
      'tenants',
      tenantId,
      'categories',
    );
  }

  /**
   * Identificador del tenant actual.
   */
  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error(
        'No hay un tenant activo para acceder a las categorías.',
      );
    }

    return tenantId;
  }

  /**
   * El administrador únicamente permite operar sobre Normal.
   */
  private validateCatalogId(
    catalogId: string,
  ): asserts catalogId is CatalogId {
    if (catalogId !== 'normal') {
      throw new Error(
        'El administrador solo permite operar sobre el catálogo.',
      );
    }
  }

  /**
   * Validación de identificadores.
   */
  private validateDocumentId(documentId: string): void {
    if (!documentId?.trim()) {
      throw new Error(
        'El identificador de la categoría es obligatorio.',
      );
    }
  }

  /**
   * Clave independiente por tenant y catálogo.
   */
  private getCacheKey(
    tenantId: string,
    catalogId: CatalogId,
  ): string {
    return `${tenantId}:${catalogId}:categories`;
  }

  /**
   * Invalidar caché después de cualquier modificación.
   */
  private invalidateCache(tenantId: string): void {
    const cacheKey = this.getCacheKey(tenantId, 'normal');

    this.cache.delete(cacheKey);
  }

  /**
   * Eliminar propiedades undefined antes de guardar.
   */
  private removeUndefinedFields(data: DocumentData): void {
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) {
        delete data[key];
      }
    }
  }
}
