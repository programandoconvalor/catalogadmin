import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { LocationService } from '../../core/location/location.service';
import type { StoreLocation } from '../../core/location/location.model';
import { NotificationService } from '../../core/notifications/notification.service';

const googleMapsUrlValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isGoogleMapsHost =
      host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      host === 'maps.google.com' ||
      host === 'google.com' ||
      host === 'www.google.com' ||
      /^([a-z0-9-]+\.)*google\.[a-z.]+$/i.test(host);

    return ['https:', 'http:'].includes(url.protocol) && isGoogleMapsHost
      ? null
      : { googleMapsUrl: true };
  } catch {
    return { googleMapsUrl: true };
  }
};

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location.component.html',
  styleUrl: './location.component.css',
})
export class LocationComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly locationService = inject(LocationService);
  private readonly notificationService = inject(NotificationService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  loading = false;
  saving = false;
  loaded = false;
  errorMessage: string | null = null;
  savedLocation: StoreLocation | null = null;

  readonly locationForm = this.formBuilder.group({
    fullAddress: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)],
    ],
    googleMapsUrl: [
      '',
      [Validators.required, Validators.maxLength(2048), googleMapsUrlValidator],
    ],
    isActive: [true],
  });

  ngOnInit(): void {
    void this.loadLocation();
  }

  get isActive(): boolean {
    return this.locationForm.controls.isActive.value;
  }

  get mapsUrl(): string {
    return this.locationForm.controls.googleMapsUrl.value.trim();
  }

  async loadLocation(): Promise<void> {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = null;

    try {
      const location = await this.locationService.getLocation();

      this.runInAngular(() => {
        this.savedLocation = location;
        this.locationForm.reset({
          fullAddress: location?.fullAddress ?? '',
          googleMapsUrl: location?.googleMapsUrl ?? '',
          isActive: location?.isActive ?? true,
        });
        this.loaded = true;
      });
    } catch (error: unknown) {
      const message = this.getErrorMessage(
        error,
        'No fue posible cargar la ubicación de tu florería.',
      );

      this.runInAngular(() => {
        this.errorMessage = message;
        this.notificationService.error(message);
      });
    } finally {
      this.runInAngular(() => {
        this.loading = false;
      });
    }
  }

  async saveChanges(): Promise<void> {
    if (this.saving) return;

    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      this.notificationService.warning(
        'Revisa la dirección y proporciona una URL válida de Google Maps.',
      );
      return;
    }

    this.saving = true;

    try {
      const value = this.locationForm.getRawValue();

      await this.locationService.saveLocation({
        fullAddress: value.fullAddress.trim(),
        googleMapsUrl: value.googleMapsUrl.trim(),
        isActive: value.isActive,
      });

      this.runInAngular(() => {
        this.savedLocation = {
          ...this.savedLocation,
          fullAddress: value.fullAddress.trim(),
          googleMapsUrl: value.googleMapsUrl.trim(),
          isActive: value.isActive,
        };
        this.locationForm.markAsPristine();
        this.notificationService.success('La ubicación se guardó correctamente.');
      });
    } catch (error: unknown) {
      const message = this.getErrorMessage(
        error,
        'No fue posible guardar la ubicación. Inténtalo nuevamente.',
      );
      this.runInAngular(() => this.notificationService.error(message));
    } finally {
      this.runInAngular(() => {
        this.saving = false;
      });
    }
  }

  private runInAngular(action: () => void): void {
    this.ngZone.run(() => {
      action();
      this.changeDetectorRef.detectChanges();
    });
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message.trim()
      ? error.message
      : fallback;
  }
}
