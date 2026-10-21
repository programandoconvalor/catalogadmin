
import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly tenantContext = inject(TenantContextService);

  async getCategories(catalogId: CatalogId): Promise<Category[]> {
    this.validateCatalogId(catalogId);

    const categoriesQuery = query(
      this.categoriesCollection(),
      where('catalogId', '==', catalogId),
    );

    const snapshot = await getDocs(categoriesQuery);

    return snapshot.docs
      .map(
        (categorySnapshot) =>
          ({
            ...categorySnapshot.data(),
            id: categorySnapshot.id,
          }) as Category,
      )
      .sort((first, second) => first.sortOrder - second.sortOrder);
  }

  async createCategory(category: CategoryInput): Promise<string> {
    this.validateCatalogId(category.catalogId);

    const payload: DocumentData = {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    this.removeUndefinedFields(payload);

    const created = await addDoc(
      this.categoriesCollection(),
      payload,
    );

    return created.id;
  }

  async updateCategory(
    categoryId: string,
    category: Partial<CategoryInput>,
  ): Promise<void> {
    this.validateDocumentId(categoryId);

    if (category.catalogId !== undefined) {
      this.validateCatalogId(category.catalogId);
    }

    const updates: DocumentData = {
      ...category,
      updatedAt: serverTimestamp(),
    };

    this.removeUndefinedFields(updates);

    await updateDoc(
      doc(this.categoriesCollection(), categoryId),
      updates,
    );
  }

  async deleteCategory(categoryId: string): Promise<void> {
    this.validateDocumentId(categoryId);

    await deleteDoc(
      doc(this.categoriesCollection(), categoryId),
    );
  }

  private categoriesCollection() {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error(
        'No hay un tenant activo para acceder a las categorías.',
      );
    }

    return collection(
      db,
      'tenants',
      tenantId,
      'categories',
    );
  }

  private validateCatalogId(catalogId: CatalogId): void {
    if (catalogId !== 'normal' && catalogId !== 'vip') {
      throw new Error(
        'Catálogo no válido. Solo se permiten Normal y VIP.',
      );
    }
  }

  private validateDocumentId(documentId: string): void {
    if (!documentId?.trim()) {
      throw new Error(
        'El identificador del documento es obligatorio.',
      );
    }
  }

  private removeUndefinedFields(data: DocumentData): void {
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) {
        delete data[key];
      }
    }
  }
}
