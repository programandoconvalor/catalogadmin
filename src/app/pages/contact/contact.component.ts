
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  CONTACT_COUNTRIES,
  ContactCountry,
  ContactInformation,
  DEFAULT_CONTACT_COUNTRY,
} from '../../core/models/contact-information.model';

import { ContactService } from '../../core/contact/contact.service';
import { NotificationService } from '../../core/notifications/notification.service';

type PhoneField = 'phone' | 'additionalPhone' | 'whatsapp';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly contactService = inject(ContactService);
  private readonly notificationService = inject(NotificationService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  readonly countries = CONTACT_COUNTRIES;

  loading = false;
  saving = false;
  loaded = false;

  openCountryPicker: PhoneField | null = null;

  countrySearch: Record<PhoneField, string> = {
    phone: '',
    additionalPhone: '',
    whatsapp: '',
  };

  savedInformation: ContactInformation | null = null;

  readonly contactForm = this.formBuilder.group({
    phoneCountry: [DEFAULT_CONTACT_COUNTRY],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9\s()-]{7,20}$/),
      ],
    ],

    additionalPhoneCountry: [DEFAULT_CONTACT_COUNTRY],
    additionalPhone: [
      '',
      [Validators.pattern(/^[0-9\s()-]{7,20}$/)],
    ],

    whatsappCountry: [DEFAULT_CONTACT_COUNTRY],
    whatsapp: [
      '',
      [Validators.pattern(/^[0-9\s()-]{7,20}$/)],
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(150),
      ],
    ],

    website: ['', [Validators.maxLength(2048)]],

    businessHours: [
      'Lunes a Sábado: 8:00 a. m. – 7:00 p. m.',
      [Validators.maxLength(150)],
    ],

    message: [
      'Escríbenos para consultas, pedidos especiales o asesoría personalizada.',
      [Validators.maxLength(200)],
    ],
  });

  ngOnInit(): void {
    void this.loadContactInformation();
  }

  get filteredCountries(): ContactCountry[] {
    if (!this.openCountryPicker) {
      return this.countries;
    }

    const field = this.openCountryPicker;
    const search = this.countrySearch[field]
      .trim()
      .toLocaleLowerCase('es');

    if (!search) {
      return this.countries;
    }

    return this.countries.filter((country) =>
      country.name.toLocaleLowerCase('es').includes(search) ||
      country.code.toLocaleLowerCase('es').includes(search) ||
      country.dialCode.includes(search),
    );
  }

  get messageLength(): number {
    return this.contactForm.controls.message.value.length;
  }

  get phoneCountry(): ContactCountry {
    return this.contactForm.controls.phoneCountry.value;
  }

  get additionalPhoneCountry(): ContactCountry {
    return this.contactForm.controls.additionalPhoneCountry.value;
  }

  get whatsappCountry(): ContactCountry {
    return this.contactForm.controls.whatsappCountry.value;
  }

  get fullPhone(): string {
    return this.formatFullPhone(
      this.phoneCountry,
      this.contactForm.controls.phone.value,
    );
  }

  get fullAdditionalPhone(): string {
    return this.formatFullPhone(
      this.additionalPhoneCountry,
      this.contactForm.controls.additionalPhone.value,
    );
  }

  get fullWhatsapp(): string {
    return this.formatFullPhone(
      this.whatsappCountry,
      this.contactForm.controls.whatsapp.value,
    );
  }

  /**
   * Devuelve una URL de bandera por código ISO 3166-1 alpha-2.
   * Se usan imágenes reales para evitar que Windows/navegador
   * sustituyan los emojis por letras o símbolos monocromáticos.
   */
  getCountryFlagUrl(country: ContactCountry): string {
    const countryCode = country.code?.trim().toLowerCase();

    if (!countryCode || !/^[a-z]{2}$/.test(countryCode)) {
      return 'https://flagcdn.com/w40/un.png';
    }

    return `https://flagcdn.com/w40/${countryCode}.png`;
  }

  async loadContactInformation(): Promise<void> {
    this.loading = true;

    try {
      const information =
        await this.contactService.getContactInformation();

      this.runInAngular(() => {
        if (information) {
          this.contactForm.reset(information);
          this.savedInformation = structuredClone(information);
        } else {
          this.savedInformation = this.getDefaultInformation();
          this.contactForm.reset(this.savedInformation);
        }

        this.loaded = true;
      });
    } catch (error) {
      console.error(
        '[Contact] Error al cargar información:',
        error,
      );

      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible cargar los datos de contacto.',
          ),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.loading = false;
      });
    }
  }

  openCountry(field: PhoneField, event: Event): void {
    event.stopPropagation();

    if (this.openCountryPicker === field) {
      this.closeCountryPicker();
      return;
    }

    this.openCountryPicker = field;
    this.countrySearch[field] = '';
  }

  selectCountry(country: ContactCountry, event: Event): void {
    event.stopPropagation();

    const field = this.openCountryPicker;

    if (!field) {
      return;
    }

    const countryControl = `${field}Country` as
      | 'phoneCountry'
      | 'additionalPhoneCountry'
      | 'whatsappCountry';

    this.contactForm.controls[countryControl].setValue(country);

    this.closeCountryPicker();
  }

  closeCountryPicker(): void {
    this.openCountryPicker = null;
  }

  onCountrySearch(field: PhoneField, value: string): void {
    this.countrySearch[field] = value;
  }

  useMainPhoneForWhatsapp(): void {
    this.contactForm.patchValue({
      whatsappCountry: this.phoneCountry,
      whatsapp: this.contactForm.controls.phone.value,
    });
  }

  undoChanges(): void {
    if (!this.savedInformation) {
      return;
    }

    this.contactForm.reset(
      structuredClone(this.savedInformation),
    );

    this.closeCountryPicker();

    this.notificationService.success(
      'Se restauraron los últimos datos guardados.',
    );
  }

  async saveChanges(): Promise<void> {
    if (this.saving) {
      return;
    }

    this.contactForm.markAllAsTouched();

    if (this.contactForm.invalid) {
      this.notificationService.error(
        'Revisa los campos obligatorios y sus formatos.',
      );
      return;
    }

    const value = this.contactForm.getRawValue();
    const website = value.website.trim();

    if (website && !this.isValidWebsite(website)) {
      this.notificationService.error(
        'Ingresa una dirección web válida, por ejemplo https://www.tufloreria.com.',
      );
      return;
    }

    const payload: ContactInformation = {
      ...value,
      website,
      email: value.email.trim(),
      phone: value.phone.trim(),
      additionalPhone: value.additionalPhone.trim(),
      whatsapp: value.whatsapp.trim(),
      businessHours: value.businessHours.trim(),
      message: value.message.trim(),
    };

    this.saving = true;

    try {
      await this.contactService.saveContactInformation(payload);

      this.runInAngular(() => {
        this.savedInformation = structuredClone(payload);
        this.contactForm.markAsPristine();

        this.notificationService.success(
          'Información de contacto guardada correctamente.',
        );
      });
    } catch (error) {
      console.error('[Contact] Error al guardar:', error);

      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible guardar la información de contacto.',
          ),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.saving = false;
      });
    }
  }

  private getDefaultInformation(): ContactInformation {
    return {
      phoneCountry: { ...DEFAULT_CONTACT_COUNTRY },
      phone: '9876543210',

      additionalPhoneCountry: { ...DEFAULT_CONTACT_COUNTRY },
      additionalPhone: '9998887777',

      whatsappCountry: { ...DEFAULT_CONTACT_COUNTRY },
      whatsapp: '9876543210',

      email: 'contacto@cielitodeflores.com',
      website: 'https://www.cielitodeflores.com',
      businessHours: 'Lunes a Sábado: 8:00 a. m. – 7:00 p. m.',
      message:
        'Escríbenos para consultas, pedidos especiales o asesoría personalizada.',
    };
  }

  private formatFullPhone(
    country: ContactCountry,
    phone: string,
  ): string {
    const cleanPhone = phone.trim();

    return cleanPhone
      ? `${country.dialCode} ${cleanPhone}`
      : '';
  }

  private isValidWebsite(value: string): boolean {
    try {
      const url = new URL(
        /^https?:\/\//i.test(value)
          ? value
          : `https://${value}`,
      );

      return (
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        url.hostname.includes('.') &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }

  private runInAngular(callback: () => void): void {
    this.ngZone.run(() => {
      callback();
      this.changeDetectorRef.markForCheck();
    });
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeCountryPicker();
  }
}
