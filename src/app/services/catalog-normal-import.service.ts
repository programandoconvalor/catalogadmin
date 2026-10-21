
import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';

import { db } from '../core/firebase/firebase';
import {
  catalogCategories,
  catalogProducts,
} from '../data/catalogProducts.normal';

export interface CatalogImportPreview {
  tenantId: string;
  catalogId: string;
  mode: 'READ_ONLY_PREVIEW';

  sourceCategoryCount: number;
  existingCategoryCount: number;
  categoriesToCreate: number;

  sourceProductCount: number;
  validProductCount: number;
  existingProductCount: number;
  productsToCreate: number;

  productsWithImages: number;
  totalImageReferences: number;

  errors: string[];
  warnings: string[];
  categoriesPending: string[];
  productsPending: string[];
  productsAlreadyExisting: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CatalogNormalImportService {
  private readonly tenantId = 'cielitodeflores';
  private readonly catalogId = 'normal';

  /**
   * SIMULACIÓN DE SOLO LECTURA.
   *
   * Este servicio no crea, modifica ni elimina documentos.
   * Lee el catálogo fuente y lo compara con Firestore.
   *
   * Las categorías y los productos se preparan para una futura
   * migración, conservando los datos comerciales originales.
   */
  async previewImport(): Promise<CatalogImportPreview> {
    const result: CatalogImportPreview = {
      tenantId: this.tenantId,
      catalogId: this.catalogId,
      mode: 'READ_ONLY_PREVIEW',

      sourceCategoryCount: catalogCategories.length,
      existingCategoryCount: 0,
      categoriesToCreate: 0,

      sourceProductCount: catalogProducts.length,
      validProductCount: 0,
      existingProductCount: 0,
      productsToCreate: 0,

      productsWithImages: 0,
      totalImageReferences: 0,

      errors: [],
      warnings: [],
      categoriesPending: [],
      productsPending: [],
      productsAlreadyExisting: [],
    };

    try {
      const categoriesRef = collection(
        db,
        'tenants',
        this.tenantId,
        'categories',
      );

      const productsRef = collection(
        db,
        'tenants',
        this.tenantId,
        'catalogs',
        this.catalogId,
        'items',
      );

      // Ambas operaciones son exclusivamente de lectura.
      const [categoriesSnapshot, productsSnapshot] =
        await Promise.all([
          getDocs(query(categoriesRef)),
          getDocs(query(productsRef)),
        ]);

      /*
       * 1. Categorías existentes.
       *
       * Se reconocen tanto el ID del documento como el campo id,
       * por si existen documentos creados anteriormente con IDs
       * automáticos.
       */
      const existingCategoryIds = new Set<string>();

      for (const categoryDoc of categoriesSnapshot.docs) {
        const data = categoryDoc.data();

        if (data['catalogId'] !== this.catalogId) {
          continue;
        }

        existingCategoryIds.add(categoryDoc.id);

        if (typeof data['id'] === 'string') {
          existingCategoryIds.add(data['id']);
        }

        result.existingCategoryCount++;
      }

      const sourceCategoryIds = new Set<string>();

      for (const category of catalogCategories) {
        if (!category.id || !category.label?.trim()) {
          result.errors.push(
            'Hay una categoría sin ID o sin nombre.',
          );
          continue;
        }

        if (sourceCategoryIds.has(category.id)) {
          result.errors.push(
            `Categoría duplicada en el archivo fuente: ${category.id}.`,
          );
          continue;
        }

        sourceCategoryIds.add(category.id);

        if (!existingCategoryIds.has(category.id)) {
          result.categoriesPending.push(
            `${category.id} — ${category.label}`,
          );
        }
      }

      result.categoriesToCreate =
        result.categoriesPending.length;

      /*
       * 2. Productos existentes.
       *
       * El SKU se busca en code o sku para reconocer documentos
       * que tengan IDs automáticos o una estructura anterior.
       */
      const existingSkus = new Set<string>();

      for (const productDoc of productsSnapshot.docs) {
        const data = productDoc.data();

        const code =
          typeof data['code'] === 'string'
            ? data['code'].trim().toUpperCase()
            : '';

        const sku =
          typeof data['sku'] === 'string'
            ? data['sku'].trim().toUpperCase()
            : '';

        if (code) {
          existingSkus.add(code);
        }

        if (sku) {
          existingSkus.add(sku);
        }
      }

      const sourceSkus = new Set<string>();
      const validCategoryIds = new Set(
        [...sourceCategoryIds].filter((id) => id !== 'all'),
      );

      /*
       * 3. Validación de productos.
       *
       * No se transforma ni se descarta la estructura comercial
       * del producto original durante esta simulación.
       */
      for (const product of catalogProducts) {
        const sku =
          typeof product.sku === 'string'
            ? product.sku.trim()
            : '';

        const name =
          typeof product.baseTitle === 'string'
            ? product.baseTitle.trim()
            : '';

        if (!sku) {
          result.errors.push(
            `Producto ID ${product.id}: SKU vacío.`,
          );
          continue;
        }

        const normalizedSku = sku.toUpperCase();

        if (sourceSkus.has(normalizedSku)) {
          result.errors.push(
            `SKU duplicado en el archivo fuente: ${sku}.`,
          );
          continue;
        }

        sourceSkus.add(normalizedSku);

        if (!name) {
          result.errors.push(
            `SKU ${sku}: nombre vacío.`,
          );
          continue;
        }

        if (
          !Number.isFinite(product.basePriceMxn) ||
          product.basePriceMxn < 0
        ) {
          result.errors.push(
            `SKU ${sku}: precio base inválido.`,
          );
          continue;
        }

        if (!validCategoryIds.has(product.categoryId)) {
          result.errors.push(
            `SKU ${sku}: la categoría "${product.categoryId}" no existe en las categorías fuente del catálogo NORMAL.`,
          );
          continue;
        }

        if (!Array.isArray(product.defaultImages)) {
          result.errors.push(
            `SKU ${sku}: defaultImages debe ser un arreglo.`,
          );
          continue;
        }

        result.validProductCount++;

        result.totalImageReferences +=
          product.defaultImages.length;

        if (product.defaultImages.length > 0) {
          result.productsWithImages++;
        }

        if (existingSkus.has(normalizedSku)) {
          result.existingProductCount++;

          result.productsAlreadyExisting.push(
            `${sku} — ya existe; no se propone modificarlo.`,
          );

          continue;
        }

        result.productsPending.push(
          `${sku} — ${name}`,
        );
      }

      result.productsToCreate =
        result.productsPending.length;

      /*
       * 4. Advertencias sobre las imágenes.
       *
       * Las rutas locales no se consideran automáticamente
       * rutas de Firebase Storage. Esta simulación no intenta
       * comprobar ni subir archivos.
       */
      if (result.totalImageReferences > 0) {
        result.warnings.push(
          'Las referencias de imágenes provienen del archivo fuente. Su existencia en Firebase Storage todavía no está verificada.',
        );
      }

      if (result.categoriesToCreate > 0) {
        result.warnings.push(
          'Hay categorías fuente que no se encontraron en los documentos de categorías del catálogo NORMAL. La simulación no las creará.',
        );
      }

      result.warnings.push(
        'Los productos existentes se identifican por SKU y no se modificarán.',
      );

      result.warnings.push(
        'Esta simulación no escribe, actualiza ni elimina documentos.',
      );

      console.info(
        'Vista previa de migración NORMAL — SOLO LECTURA',
        result,
      );

      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error desconocido al consultar Firestore.';

      result.errors.push(
        `No fue posible completar la simulación: ${message}`,
      );

      console.error(
        'Error en la vista previa de migración NORMAL:',
        error,
      );

      return result;
    }
  }
}
