
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
import type { CatalogId } from '../models/catalog-item.model';
import type {
  DeliveryZone,
  DeliveryZoneInput,
} from '../models/delivery-zone.model';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable({ providedIn: 'root' })
export class DeliveryZoneService {
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Obtiene únicamente las zonas del catálogo solicitado.
   */
  async getDeliveryZones(catalogId: CatalogId): Promise<DeliveryZone[]> {
    this.validateCatalogId(catalogId);

    const snapshot = await getDocs(
      query(
        this.deliveryZonesCollection(),
        where('catalogId', '==', catalogId),
      ),
    );

    return snapshot.docs
      .map((item) => ({ ...item.data(), id: item.id }) as DeliveryZone)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name, 'es'),
      );
  }

  /**
   * Crea una zona exclusiva del catálogo indicado.
   */
  async createDeliveryZone(input: DeliveryZoneInput): Promise<string> {
    this.validateInput(input);

    const payload: DocumentData = {
      catalogId: input.catalogId,
      name: input.name.trim(),
      status: input.status,
      sortOrder: input.sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    this.removeUndefinedFields(payload);

    const created = await addDoc(
      this.deliveryZonesCollection(),
      payload,
    );

    return created.id;
  }

  /**
   * Actualiza una zona solo si pertenece al catálogo indicado.
   */
  async updateDeliveryZone(
    id: string,
    input: DeliveryZoneInput,
  ): Promise<void> {
    this.validateId(id);
    this.validateInput(input);

    const zoneRef = doc(this.deliveryZonesCollection(), id);
    const existing = await getDoc(zoneRef);

    if (!existing.exists()) {
      throw new Error('La zona de entrega no existe.');
    }

    const existingZone = existing.data() as DeliveryZone;

    if (existingZone.catalogId !== input.catalogId) {
      throw new Error(
        'No puedes modificar una zona que pertenece a otro catálogo.',
      );
    }

    const payload: DocumentData = {
      catalogId: input.catalogId,
      name: input.name.trim(),
      status: input.status,
      sortOrder: input.sortOrder,
      updatedAt: serverTimestamp(),
    };

    this.removeUndefinedFields(payload);

    await updateDoc(zoneRef, payload);
  }

  /**
   * Elimina una zona solo si pertenece al catálogo indicado.
   */
  async deleteDeliveryZone(
    id: string,
    catalogId: CatalogId,
  ): Promise<void> {
    this.validateId(id);
    this.validateCatalogId(catalogId);

    const zoneRef = doc(this.deliveryZonesCollection(), id);
    const existing = await getDoc(zoneRef);

    if (!existing.exists()) {
      throw new Error('La zona de entrega no existe.');
    }

    const existingZone = existing.data() as DeliveryZone;

    if (existingZone.catalogId !== catalogId) {
      throw new Error(
        'No puedes eliminar una zona que pertenece a otro catálogo.',
      );
    }

    await deleteDoc(zoneRef);
  }

  private deliveryZonesCollection() {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error(
        'No hay un tenant activo para administrar las zonas de entrega.',
      );
    }

    // La colección pertenece al tenant.
    // Cada documento se separa mediante catalogId: normal o vip.
    return collection(db, 'tenants', tenantId, 'deliveryZones');
  }

  private validateCatalogId(catalogId: CatalogId): void {
    if (catalogId !== 'normal' && catalogId !== 'vip') {
      throw new Error('El catálogo debe ser normal o vip.');
    }
  }

  private validateInput(input: DeliveryZoneInput): void {
    this.validateCatalogId(input.catalogId);

    if (!input.name?.trim()) {
      throw new Error('El nombre de la zona es obligatorio.');
    }

    if (input.name.trim().length > 100) {
      throw new Error(
        'El nombre de la zona no puede superar los 100 caracteres.',
      );
    }

    if (input.status !== 'active' && input.status !== 'inactive') {
      throw new Error('El estado de la zona no es válido.');
    }

    if (
      !Number.isInteger(input.sortOrder) ||
      input.sortOrder < 0
    ) {
      throw new Error('El orden debe ser un entero mayor o igual a cero.');
    }
  }

  private validateId(id: string): void {
    if (!id?.trim()) {
      throw new Error('El identificador de la zona es obligatorio.');
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
