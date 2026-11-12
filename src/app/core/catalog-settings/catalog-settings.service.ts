import { Injectable, inject } from '@angular/core';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { TenantContextService } from '../tenant/tenant-context.service';

import {
  CatalogSettings,
  DEFAULT_CATALOG_SETTINGS,
} from './catalog-settings.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogSettingsService {
  private readonly tenantContext = inject(TenantContextService);

  private readonly documentId = 'display';

  private getSettingsDocument() {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId) {
      throw new Error(
        'No se encontró un tenant activo para cargar la configuración.',
      );
    }

    return doc(
      db,
      'tenants',
      tenantId,
      'settings',
      this.documentId,
    );
  }

  async getSettings(): Promise<CatalogSettings> {
    const settingsRef = this.getSettingsDocument();
    const snapshot = await getDoc(settingsRef);

    if (!snapshot.exists()) {
      return { ...DEFAULT_CATALOG_SETTINGS };
    }

    const data = snapshot.data();

    return {
      showSearch:
        typeof data['showSearch'] === 'boolean'
          ? data['showSearch']
          : DEFAULT_CATALOG_SETTINGS.showSearch,

      showProductDetail:
        typeof data['showProductDetail'] === 'boolean'
          ? data['showProductDetail']
          : DEFAULT_CATALOG_SETTINGS.showProductDetail,

      showProductCode:
        typeof data['showProductCode'] === 'boolean'
          ? data['showProductCode']
          : DEFAULT_CATALOG_SETTINGS.showProductCode,

      primaryColor:
        typeof data['primaryColor'] === 'string'
          ? data['primaryColor']
          : DEFAULT_CATALOG_SETTINGS.primaryColor,

      createdAt: data['createdAt'],
      updatedAt: data['updatedAt'],
    };
  }

  async saveSettings(
    settings: CatalogSettings,
    isNew = false,
  ): Promise<void> {
    const settingsRef = this.getSettingsDocument();

    const data = {
      showSearch: settings.showSearch,
      showProductDetail: settings.showProductDetail,
      showProductCode: settings.showProductCode,
      primaryColor: settings.primaryColor,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
    };

    await setDoc(settingsRef, data, { merge: true });
  }
}