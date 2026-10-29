import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { db, storage } from '../../core/firebase/firebase';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { NotificationService } from '../../core/notifications/notification.service';
import {
  StoreProfile,
  StoreSocialNetwork,
  DEFAULT_STORE_PROFILE,
  SOCIAL_NETWORKS,
} from '../../core/models/store-profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly tenantContext = inject(TenantContextService);
  private readonly notifications = inject(NotificationService);

  profile: StoreProfile = this.createEmptyProfile();
  readonly socialNetworks = SOCIAL_NETWORKS;
  readonly tabs = [
    { id: 'general', label: 'Información general', icon: '' },
    { id: 'contact', label: 'Teléfonos y contacto', icon: '' },
    { id: 'redes', label: 'Redes sociales', icon: '' },
    { id: 'address', label: 'Dirección y mapa', icon: '' },
    { id: 'appearance', label: 'Apariencia y métodos de pago', icon: '' },
  ];
  activeTab = 'general';
  loading = false;
  saving = false;
  uploadingLogo = false;
  uploadingCover = false;
  errorMessage = '';
  successMessage = '';
  logoFile: File | null = null;
  coverFile: File | null = null;
  mapSearch = '';
  resolvingMapUrl = false;
  readonly maxSocialNetworks = 5;
  readonly maxAdditionalPhones = 3;
  readonly phoneCountries = [
    { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
    { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
    { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
    { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
    { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
    { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
    { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
    { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
    { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
    { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
    { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
    { code: 'DO', name: 'República Dominicana', dialCode: '+1', flag: '🇩🇴' },
  ];
  primaryPhoneCountryCode = 'MX';
  primaryPhoneNormalCountryCode = 'MX';
  primaryPhoneVipCountryCode = 'MX';
  private persistedProfile: StoreProfile = this.createEmptyProfile();

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  private createEmptyProfile(): StoreProfile {
    return {
      ...DEFAULT_STORE_PROFILE,
      phones: [],
      socials: [],
      payments: ['cash', 'deposit', 'transfer'],
      address: { street: '', city: '', state: '', postalCode: '', country: 'México', mapUrl: '', latitude: null, longitude: null },
    };
  }

  get tenantId(): string | null {
    return this.tenantContext.tenantId;
  }

  get fullAddress(): string {
    const a = this.profile.address;
    return [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ');
  }

  get addressPreview(): string {
    const address = this.profile.address;
    return [address.street, address.city, address.state, address.postalCode]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(', ');
  }

  get mapPreviewUrl(): string {
    if (this.profile.address.mapUrl?.trim()) return this.profile.address.mapUrl.trim();
    if (this.fullAddress.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.fullAddress)}`;
    }
    return '';
  }

  get socialOptionsAvailable(): typeof SOCIAL_NETWORKS {
    const selected = new Set(this.profile.socials.map((item) => item.network));
    return SOCIAL_NETWORKS.filter((network) => !selected.has(network.id));
  }

  async loadProfile(): Promise<void> {
    this.errorMessage = '';
    try {
      const tenantId = this.requireTenantId();
      const profileRef = doc(db, 'tenants', tenantId, 'settings', 'storeProfile');
      const snapshot = await getDoc(profileRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<StoreProfile>;
        this.profile = {
          ...this.createEmptyProfile(),
          ...data,
          // Si el documento de perfil aún no tiene logo, reutilizar el del tenant.
          logoUrl: data.logoUrl || this.tenantContext.tenant?.logoUrl || '',
          // Migración transparente: los perfiles anteriores solo tenían un teléfono principal.
          // Se usa como valor inicial del catálogo Normal; no se pierde el dato original.
          primaryPhoneNormal: data.primaryPhoneNormal ?? data.primaryPhone ?? '',
          primaryPhoneNormalCountryCode: data.primaryPhoneNormalCountryCode ?? data.primaryPhoneCountryCode ?? 'MX',
          primaryPhoneVip: data.primaryPhoneVip ?? '',
          primaryPhoneVipCountryCode: data.primaryPhoneVipCountryCode ?? 'MX',
          phones: Array.isArray(data.phones) ? data.phones.slice(0, this.maxAdditionalPhones).map((phone) => ({ ...phone, countryCode: phone.countryCode || 'MX' })) : [],
          socials: Array.isArray(data.socials) ? data.socials.slice(0, this.maxSocialNetworks) : [],
          payments: Array.isArray(data.payments) ? data.payments : ['cash', 'deposit', 'transfer'],
          address: { ...this.createEmptyProfile().address, ...(data.address ?? {}) },
        };
      } else {
        this.profile = {
          ...this.createEmptyProfile(),
          name: this.tenantContext.tenant?.name ?? '',
          logoUrl: this.tenantContext.tenant?.logoUrl ?? '',
        };
      }
      this.primaryPhoneNormalCountryCode = this.profile.primaryPhoneNormalCountryCode || this.profile.primaryPhoneCountryCode || 'MX';
      this.primaryPhoneVipCountryCode = this.profile.primaryPhoneVipCountryCode || 'MX';
      // Alias de compatibilidad para cualquier código anterior del perfil.
      this.primaryPhoneCountryCode = this.primaryPhoneNormalCountryCode;
      this.persistedProfile = JSON.parse(JSON.stringify(this.profile)) as StoreProfile;
    } catch (error) {
      this.errorMessage = this.errorText(error, 'No fue posible cargar el perfil de la florería.');
    } finally {
      this.loading = false;
    }
  }

  async saveProfile(section: string = this.activeTab): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const tenantId = this.requireTenantId();
      const sectionKeys: Record<string, (keyof StoreProfile)[]> = {
        general: ['name', 'tagline', 'description', 'logoUrl'],
        redes: [ 'socials'],
        contact: ['primaryPhone', 'primaryPhoneCountryCode', 'primaryPhoneNormal', 'primaryPhoneNormalCountryCode', 'primaryPhoneVip', 'primaryPhoneVipCountryCode', 'email', 'website', 'socials'],
        address: ['address'],
        appearance: ['primaryColor', 'payments'],
        preview: [],
      };
      const keys = sectionKeys[section] ?? [];
      if (section === 'preview') {
        this.successMessage = 'No hay cambios editables en la vista previa. Selecciona una sección para guardar.';
        return;
      }

      // Validar únicamente la sección que el usuario está guardando.
      if (section === 'general') {
        this.profile.name = this.profile.name.trim();
        this.profile.tagline = this.profile.tagline.trim();
        this.profile.description = (this.profile.description || '').trim().slice(0, 150);
        if (!this.profile.name) throw new Error('El nombre de la florería es obligatorio.');
      }

      if (section === 'redes') {
       
        this.profile.socials = this.profile.socials
          .map((social) => ({ ...social, url: social.url.trim() }))
          .filter((social) => social.url)
          .slice(0, this.maxSocialNetworks);
      
      }

      if (section === 'contact') {
        this.profile.primaryPhoneNormal = (this.profile.primaryPhoneNormal || '').trim();
        this.profile.primaryPhoneVip = (this.profile.primaryPhoneVip || '').trim();
        this.profile.email = (this.profile.email || '').trim();
        this.profile.website = (this.profile.website || '').trim();
        this.profile.socials = this.profile.socials
          .map((social) => ({ ...social, url: social.url.trim() }))
          .filter((social) => social.url)
          .slice(0, this.maxSocialNetworks);
        if (!this.profile.primaryPhoneNormal) throw new Error('El teléfono principal para Catálogo Normal es obligatorio.');
        if (!this.profile.primaryPhoneVip) throw new Error('El teléfono principal para Catálogo VIP es obligatorio.');
        // Mantener los campos antiguos sincronizados con Normal para compatibilidad.
        this.profile.primaryPhone = this.profile.primaryPhoneNormal;
        this.profile.primaryPhoneCountryCode = this.primaryPhoneNormalCountryCode;
        this.profile.primaryPhoneNormalCountryCode = this.primaryPhoneNormalCountryCode;
        this.profile.primaryPhoneVipCountryCode = this.primaryPhoneVipCountryCode;
      }


      if (section === 'general' && this.logoFile) {
        this.uploadingLogo = true;
        this.profile.logoUrl = await this.uploadBrandAsset(tenantId, this.logoFile, 'logo');
        this.logoFile = null;
      }
      if (section === 'appearance' && this.coverFile) {
        this.uploadingCover = true;
        this.profile.coverUrl = await this.uploadBrandAsset(tenantId, this.coverFile, 'cover');
        this.coverFile = null;
      }

      const sectionData: Partial<StoreProfile> = {};
      for (const key of keys) {
        (sectionData as Record<string, unknown>)[key] = this.profile[key];
      }
      if (section === 'contact') {
        sectionData.primaryPhone = this.profile.primaryPhoneNormal;
        sectionData.primaryPhoneCountryCode = this.primaryPhoneNormalCountryCode;
        sectionData.primaryPhoneNormalCountryCode = this.primaryPhoneNormalCountryCode;
        sectionData.primaryPhoneVipCountryCode = this.primaryPhoneVipCountryCode;
      }

      await setDoc(
        doc(db, 'tenants', tenantId, 'settings', 'storeProfile'),
        { ...sectionData, updatedAt: serverTimestamp() },
        { merge: true },
      );

      // El perfil del catálogo y el documento principal del tenant comparten
      // el logo. Header, sidebar y menú superior leen tenants/{tenantId}.logoUrl.
      // Sin sincronizar ambos documentos, el archivo se sube pero esos lugares
      // continúan mostrando el icono predeterminado.
      if (section === 'general') {
        await updateDoc(doc(db, 'tenants', tenantId), {
          name: this.profile.name,
          logoUrl: this.profile.logoUrl || '',
          updatedAt: serverTimestamp(),
        });

        this.tenantContext.updateTenantBranding(
          this.profile.name,
          this.profile.logoUrl || '',
        );
      }

      this.persistedProfile = { ...this.persistedProfile, ...sectionData } as StoreProfile;
      this.successMessage = `La sección "${this.tabs.find((tab) => tab.id === section)?.label ?? section}" se guardó correctamente.`;
      this.notifications.success(this.successMessage, 'Cambios guardados');
    } catch (error) {
      this.errorMessage = this.errorText(error, 'No fue posible guardar esta sección.');
      this.notifications.error(this.errorMessage, 'No se pudieron guardar los cambios');
    } finally {
      this.saving = false;
      this.uploadingLogo = false;
      this.uploadingCover = false;
    }
  }

  phoneCountry(code: string) {
    return this.phoneCountries.find((country) => country.code === code) ?? this.phoneCountries[0];
  }

  onPrimaryPhoneCountryChange(code: string): void {
    this.primaryPhoneNormalCountryCode = code;
    this.primaryPhoneCountryCode = code;
  }

  onVipPhoneCountryChange(code: string): void {
    this.primaryPhoneVipCountryCode = code;
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const error = this.validateImage(file, 2);
    if (error) {
      this.errorMessage = error;
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.logoFile = file;
    this.profile.logoUrl = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  onCoverSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const error = this.validateImage(file, 3);
    if (error) {
      this.errorMessage = error;
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.coverFile = file;
    this.profile.coverUrl = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  addSocial(): void {
    if (this.profile.socials.length >= this.maxSocialNetworks) return;
    const next = this.socialOptionsAvailable[0];
    if (!next) return;
    this.profile.socials.push({ network: next.id, url: '' });
  }

  removeSocial(index: number): void {
    this.profile.socials.splice(index, 1);
  }

  socialMeta(networkId: string) {
    return SOCIAL_NETWORKS.find((network) => network.id === networkId) ?? SOCIAL_NETWORKS[0];
  }

  togglePayment(payment: string, checked: boolean): void {
    const selected = new Set(this.profile.payments);
    checked ? selected.add(payment) : selected.delete(payment);
    this.profile.payments = Array.from(selected);
  }

  paymentChecked(payment: string): boolean {
    return this.profile.payments.includes(payment);
  }

  async uploadBrandAsset(tenantId: string, file: File, kind: 'logo' | 'cover'): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = `${kind}-${Date.now()}.${extension}`;
    const assetPath = kind === 'logo'
      ? `tenants/${tenantId}/logo/images/${safeName}`
      : `tenants/${tenantId}/branding/cover/images/${safeName}`;
    const assetRef = ref(storage, assetPath);
    await uploadBytes(assetRef, file, { contentType: file.type });
    return getDownloadURL(assetRef);
  }

  /**
   * Al salir del campo del enlace, intenta obtener las coordenadas y completar
   * la dirección. Google Maps no ofrece geocodificación inversa pública sin API;
   * por eso se consultan coordenadas con OpenStreetMap cuando están disponibles.
   */
  async onMapUrlBlur(): Promise<void> {
    const rawUrl = (this.profile.address.mapUrl || '').trim();
    if (!rawUrl) return;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      this.notifications.warning('Pega una URL válida de Google Maps.', 'Enlace de mapa');
      return;
    }

    const coordinateMatch = rawUrl.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
      ?? rawUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
      ?? (() => {
        const q = parsedUrl.searchParams.get('q') ?? parsedUrl.searchParams.get('query') ?? '';
        const match = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
        return match;
      })();

    if (coordinateMatch) {
      const latitude = Number(coordinateMatch[1]);
      const longitude = Number(coordinateMatch[2]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        this.profile.address.latitude = latitude;
        this.profile.address.longitude = longitude;
        this.resolvingMapUrl = true;
        try {
          const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`;
          const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
          if (response.ok) {
            const result = await response.json() as { address?: Record<string, string>; display_name?: string };
            const address = result.address ?? {};
            const streetParts = [address['road'], address['house_number'], address['suburb'] ?? address['neighbourhood'] ?? address['quarter']]
              .filter((part): part is string => Boolean(part));
            if (streetParts.length) this.profile.address.street = streetParts.join(', ');
            this.profile.address['city'] = address['city'] ?? address['town'] ?? address['village'] ?? address['municipality'] ?? this.profile.address['city'];
            this.profile.address['state'] = address['state'] ?? address['region'] ?? this.profile.address['state'];
            this.profile.address.postalCode = address['postcode'] ?? this.profile.address.postalCode;
            this.profile.address['country'] = address['country'] ?? this.profile.address['country'];
            this.notifications.success('Se completaron los datos disponibles a partir de la ubicación del mapa.', 'Ubicación detectada');
          } else {
            this.notifications.info('Se guardaron las coordenadas del mapa. Completa manualmente los datos que falten.', 'Ubicación detectada');
          }
        } catch {
          this.notifications.info('Se detectaron las coordenadas. Completa manualmente los datos de dirección que falten.', 'Ubicación detectada');
        } finally {
          this.resolvingMapUrl = false;
        }
        return;
      }
    }

    // Si el enlace contiene una búsqueda o nombre de lugar, lo usamos como
    // dirección inicial en vez de dejar el formulario completamente vacío.
    const query = parsedUrl.searchParams.get('query')
      ?? parsedUrl.searchParams.get('q')
      ?? parsedUrl.searchParams.get('destination');
    const placeMatch = rawUrl.match(/\/maps\/place\/([^/]+)/);
    const place = query || (placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : '');
    if (place && !/^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/.test(place)) {
      this.profile.address.street = decodeURIComponent(place.replace(/\+/g, ' '));
      this.notifications.info('Se copió el nombre o búsqueda del enlace al campo de dirección. Revisa y completa los datos que falten.', 'Dirección sugerida');
    } else {
      this.notifications.warning('El enlace no incluye una ubicación que pueda leerse automáticamente. Puedes dejar los campos vacíos y usar el enlace del mapa.', 'No se detectó la dirección');
    }
  }

  paymentLabels(): string {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      deposit: 'Depósitos',
      transfer: 'Transferencias',
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      paypal: 'PayPal',
      mercado_pago: 'Mercado Pago',
      oxxo: 'OXXO',
    };
    const selected = this.profile.payments
      .map((payment) => labels[payment] ?? payment)
      .filter(Boolean);
    return selected.length ? selected.join(' · ') : 'Configura tus métodos de pago';
  }

  openMap(): void {
    if (this.mapPreviewUrl) window.open(this.mapPreviewUrl, '_blank', 'noopener,noreferrer');
  }

  private validateImage(file: File, maxMb: number): string | null {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return 'Solo se permiten imágenes JPG, PNG o WebP.';
    }
    if (file.size > maxMb * 1024 * 1024) {
      return `La imagen no puede superar ${maxMb} MB.`;
    }
    return null;
  }

  private requireTenantId(): string {
    const tenantId = this.tenantId;
    if (!tenantId?.trim()) throw new Error('No hay una florería activa asociada a esta sesión.');
    return tenantId;
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
