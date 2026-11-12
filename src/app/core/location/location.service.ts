import { Injectable, inject } from '@angular/core';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { TenantContextService } from '../tenant/tenant-context.service';
import type { StoreLocation } from './location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly tenantContext = inject(TenantContextService);

  /** Obtiene la ubicación principal del tenant activo. */
  async getLocation(): Promise<StoreLocation | null> {
    const tenantId = this.requireTenantId();

    try {
      const snapshot = await getDoc(this.locationDocument(tenantId));

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();

      return {
        fullAddress: this.stringValue(data['fullAddress']),
        googleMapsUrl: this.stringValue(data['googleMapsUrl']),
        isActive: data['isActive'] !== false,
        createdAt: data['createdAt'],
        updatedAt: data['updatedAt'],
      };
    } catch (error) {
      console.error('[LocationService] Error al consultar ubicación:', error);
      throw error;
    }
  }

  /**
   * Crea o actualiza siempre el mismo documento:
   * tenants/{tenantId}/locations/main
   */
  async saveLocation(location: Pick<StoreLocation, 'fullAddress' | 'googleMapsUrl' | 'isActive'>): Promise<void> {
    const tenantId = this.requireTenantId();
    const documentRef = this.locationDocument(tenantId);

    try {
      const currentSnapshot = await getDoc(documentRef);
      const payload: Record<string, unknown> = {
        fullAddress: location.fullAddress.trim(),
        googleMapsUrl: location.googleMapsUrl.trim(),
        isActive: location.isActive,
        updatedAt: serverTimestamp(),
      };

      if (!currentSnapshot.exists()) {
        payload['createdAt'] = serverTimestamp();
      }

      await setDoc(documentRef, payload, { merge: true });
    } catch (error) {
      console.error('[LocationService] Error al guardar ubicación:', error);
      throw error;
    }
  }

  private locationDocument(tenantId: string) {
    return doc(db, 'tenants', tenantId, 'locations', 'main');
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error('No se encontró el tenant activo. Inicia sesión nuevamente.');
    }

    return tenantId;
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
