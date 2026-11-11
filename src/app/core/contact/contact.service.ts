
import { Injectable, inject } from '@angular/core';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { TenantContextService } from '../tenant/tenant-context.service';

import {
  ContactInformation,
  ContactCountry,
  DEFAULT_CONTACT_COUNTRY,
} from '../models/contact-information.model';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly tenantContext = inject(TenantContextService);

  async getContactInformation(): Promise<ContactInformation | null> {
    const tenantId = this.requireTenantId();

    try {
      const snapshot = await getDoc(
        this.contactDocument(tenantId),
      );

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();

      return {
        phoneCountry: this.normalizeCountry(data['phoneCountry']),
        phone: this.stringValue(data['phone']),
        additionalPhoneCountry: this.normalizeCountry(
          data['additionalPhoneCountry'],
        ),
        additionalPhone: this.stringValue(data['additionalPhone']),
        whatsappCountry: this.normalizeCountry(
          data['whatsappCountry'],
        ),
        whatsapp: this.stringValue(data['whatsapp']),
        email: this.stringValue(data['email']),
        website: this.stringValue(data['website']),
        businessHours: this.stringValue(data['businessHours']),
        message: this.stringValue(data['message']),
        updatedAt: data['updatedAt'],
      };
    } catch (error) {
      console.error(
        '[ContactService] Error al consultar contacto:',
        error,
      );
      throw error;
    }
  }

  async saveContactInformation(
    information: ContactInformation,
  ): Promise<void> {
    const tenantId = this.requireTenantId();

    try {
      const payload = {
        phoneCountry: information.phoneCountry,
        phone: information.phone.trim(),

        additionalPhoneCountry: information.additionalPhoneCountry,
        additionalPhone: information.additionalPhone.trim(),

        whatsappCountry: information.whatsappCountry,
        whatsapp: information.whatsapp.trim(),

        email: information.email.trim(),
        website: information.website.trim(),
        businessHours: information.businessHours.trim(),
        message: information.message.trim(),

        updatedAt: serverTimestamp(),
      };

      await setDoc(
        this.contactDocument(tenantId),
        payload,
        { merge: true },
      );
    } catch (error) {
      console.error(
        '[ContactService] Error al guardar contacto:',
        error,
      );
      throw error;
    }
  }

  private contactDocument(tenantId: string) {
    return doc(
      db,
      'tenants',
      tenantId,
      'contact',
      'information',
    );
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId?.trim()) {
      throw new Error(
        'No se encontró el tenant activo. Inicia sesión nuevamente.',
      );
    }

    return tenantId;
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private normalizeCountry(value: unknown): ContactCountry {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_CONTACT_COUNTRY };
    }

    const country = value as Partial<ContactCountry>;

    if (
      typeof country.code !== 'string' ||
      typeof country.name !== 'string' ||
      typeof country.dialCode !== 'string' ||
      typeof country.flag !== 'string'
    ) {
      return { ...DEFAULT_CONTACT_COUNTRY };
    }

    return {
      code: country.code,
      name: country.name,
      dialCode: country.dialCode,
      flag: country.flag,
    };
  }
}
