import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { CatalogId } from '../models/catalog-item.model';
import type {
  DeliveryZone,
  DeliveryZoneInput,
  DeliveryZoneStatus,
} from '../models/delivery-zone.model';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable({ providedIn: 'root' })
export class DeliveryZoneService {
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Obtiene las zonas del tenant. El argumento opcional se conserva para
   * compatibilidad con las pantallas antiguas que enviaban catalogId.
   */
  async getDeliveryZones(_catalogId?: CatalogId): Promise<DeliveryZone[]> {
    const snapshot = await getDocs(
      query(this.deliveryZonesCollection(), orderBy('sortOrder', 'asc')),
    );

    return snapshot.docs
      .map((item) => this.fromFirestore(item.id, item.data()))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.zoneName.localeCompare(b.zoneName, 'es'));
  }

  async createDeliveryZone(input: DeliveryZoneInput): Promise<string> {
    const normalized = this.normalizeInput(input);
    const created = await addDoc(this.deliveryZonesCollection(), {
      zoneName: normalized.zoneName,
      shippingCost: normalized.shippingCost,
      deliveryTime: normalized.deliveryTime,
      isActive: normalized.isActive,
      sortOrder: normalized.sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return created.id;
  }

  async updateDeliveryZone(id: string, input: DeliveryZoneInput): Promise<void> {
    this.validateId(id);
    const normalized = this.normalizeInput(input);
    await updateDoc(doc(this.deliveryZonesCollection(), id), {
      zoneName: normalized.zoneName,
      shippingCost: normalized.shippingCost,
      deliveryTime: normalized.deliveryTime,
      isActive: normalized.isActive,
      sortOrder: normalized.sortOrder,
      updatedAt: serverTimestamp(),
    });
  }

  /** Actualiza únicamente el estado de una zona de entrega. */
  async updateZoneStatus(id: string, isActive: boolean): Promise<void> {
    this.validateId(id);
    await updateDoc(doc(this.deliveryZonesCollection(), id), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  }

  /** El segundo argumento es opcional para compatibilidad con llamadas antiguas. */
  async deleteDeliveryZone(id: string, _catalogId?: CatalogId): Promise<void> {
    this.validateId(id);
    const zoneRef = doc(this.deliveryZonesCollection(), id);
    const existing = await getDoc(zoneRef);
    if (!existing.exists()) {
      throw new Error('La zona de entrega no existe.');
    }
    await deleteDoc(zoneRef);
  }

  private fromFirestore(id: string, data: DocumentData): DeliveryZone {
    const zoneName = typeof data['zoneName'] === 'string'
      ? data['zoneName']
      : typeof data['name'] === 'string' ? data['name'] : '';
    const isActive = typeof data['isActive'] === 'boolean'
      ? data['isActive']
      : data['status'] === 'active';

    return {
      id,
      zoneName,
      name: zoneName,
      shippingCost: typeof data['shippingCost'] === 'number' ? data['shippingCost'] : null,
      deliveryTime: typeof data['deliveryTime'] === 'string' ? data['deliveryTime'] : null,
      isActive,
      status: isActive ? 'active' : 'inactive',
      sortOrder: Number.isInteger(data['sortOrder']) ? data['sortOrder'] : 0,
      createdAt: data['createdAt'],
      updatedAt: data['updatedAt'],
      ...(data['catalogId'] ? { catalogId: data['catalogId'] as CatalogId } : {}),
    };
  }

  private normalizeInput(input: DeliveryZoneInput): {
    zoneName: string;
    shippingCost: number | null;
    deliveryTime: string | null;
    isActive: boolean;
    sortOrder: number;
  } {
    const zoneName = (input.zoneName ?? input.name ?? '').trim();
    if (!zoneName) throw new Error('El nombre de la zona es obligatorio.');
    if (zoneName.length > 100) throw new Error('El nombre de la zona no puede superar los 100 caracteres.');

    const isActive = input.isActive ?? (input.status ? input.status === 'active' : true);
    if (typeof isActive !== 'boolean') throw new Error('El estado de la zona no es válido.');
    if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
      throw new Error('El orden debe ser un entero mayor o igual a cero.');
    }

    const shippingCost = input.shippingCost === undefined || input.shippingCost === null
      ? null
      : Number(input.shippingCost);
    if (shippingCost !== null && (!Number.isFinite(shippingCost) || shippingCost < 0)) {
      throw new Error('El costo de envío debe ser un número mayor o igual a cero.');
    }

    const deliveryTime = input.deliveryTime?.trim() || null;
    return { zoneName, shippingCost, deliveryTime, isActive, sortOrder: input.sortOrder };
  }

  private deliveryZonesCollection() {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId?.trim()) {
      throw new Error('No hay un tenant activo para administrar las zonas de entrega.');
    }
    return collection(db, 'tenants', tenantId, 'deliveryZones');
  }

  private validateId(id: string): void {
    if (!id?.trim()) throw new Error('El identificador de la zona es obligatorio.');
  }
}
