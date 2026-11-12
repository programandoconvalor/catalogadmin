
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  NgZone,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { BrandingIdentityService } from '../../core/branding/branding-identity.service';
import type {
  BrandingIdentity,
  BrandingImageType,
  UploadedBrandingImage,
} from '../../core/models/branding-identity.model';
import { NotificationService } from '../../core/notifications/notification.service';

import { CatalogPreviewComponent } from '../../shared/components/catalog-preview/catalog-preview.component';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CatalogPreviewComponent,
  ],
  templateUrl: './branding.component.html',
  styleUrl: './branding.component.css',
})
export class BrandingComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly ngZone = inject(NgZone);
  private readonly brandingService = inject(BrandingIdentityService);
  private readonly notificationService = inject(NotificationService);

  loading = false;
  saving = false;
  errorMessage: string | null = null;

  identity: BrandingIdentity | null = null;

  selectedLogo: File | null = null;
  selectedFavicon: File | null = null;

  logoPreviewUrl: string | null = null;
  faviconPreviewUrl: string | null = null;

  // Controlan los errores de carga de las imágenes.
  logoImageLoadFailed = false;
  faviconImageLoadFailed = false;

  private originalLogoStoragePath = '';
  private originalFaviconStoragePath = '';

  readonly brandingForm = this.formBuilder.group({
    storeName: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120),
      ],
    ],
    tagline: ['', [Validators.maxLength(160)]],
  });

  ngOnInit(): void {
    void this.loadIdentity();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrls();
  }

  async loadIdentity(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;

    try {
      const result = await this.brandingService.getIdentity();

      this.runInAngular(() => {
        this.identity = result;

        this.originalLogoStoragePath = result?.logoStoragePath ?? '';
        this.originalFaviconStoragePath = result?.faviconStoragePath ?? '';

        this.brandingForm.reset({
          storeName: result?.storeName ?? '',
          tagline: result?.tagline ?? '',
        });

        this.logoPreviewUrl = result?.logoUrl || null;
        this.faviconPreviewUrl = result?.faviconUrl || null;

        this.logoImageLoadFailed = false;
        this.faviconImageLoadFailed = false;
      });
    } catch (error: unknown) {
      console.error('[Branding] Error al cargar identidad:', error);

      this.runInAngular(() => {
        this.errorMessage = this.getErrorMessage(
          error,
          'No fue posible cargar la identidad de la florería.',
        );

        this.notificationService.error(this.errorMessage!);
      });
    } finally {
      this.runInAngular(() => {
        this.loading = false;
      });
    }
  }

  /**
   * Se ejecuta cuando una imagen de Storage o una imagen local
   * no puede cargarse. El HTML mostrará el SVG predeterminado.
   */
  onPreviewImageError(type: BrandingImageType): void {
    this.runInAngular(() => {
      if (type === 'logo') {
        this.logoImageLoadFailed = true;
        this.logoPreviewUrl = null;
      } else {
        this.faviconImageLoadFailed = true;
        this.faviconPreviewUrl = null;
      }
    });
  }

  onImageSelected(
    event: Event,
    type: BrandingImageType,
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const validationError = this.validateImage(type, file);

    if (validationError) {
      this.notificationService.error(validationError);
      input.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === 'logo') {
      this.revokeLogoPreview();

      this.selectedLogo = file;
      this.logoPreviewUrl = previewUrl;
      this.logoImageLoadFailed = false;
    } else {
      this.revokeFaviconPreview();

      this.selectedFavicon = file;
      this.faviconPreviewUrl = previewUrl;
      this.faviconImageLoadFailed = false;
    }

    input.value = '';
  }

  removeSelectedImage(type: BrandingImageType): void {
    if (type === 'logo') {
      this.revokeLogoPreview();

      this.selectedLogo = null;
      this.logoPreviewUrl = this.logoImageLoadFailed
        ? null
        : this.identity?.logoUrl || null;

      return;
    }

    this.revokeFaviconPreview();

    this.selectedFavicon = null;
    this.faviconPreviewUrl = this.faviconImageLoadFailed
      ? null
      : this.identity?.faviconUrl || null;
  }

  async saveIdentity(): Promise<void> {
    if (this.saving) {
      return;
    }

    if (this.brandingForm.invalid) {
      this.brandingForm.markAllAsTouched();

      this.notificationService.error(
        'Ingresa un nombre válido para la florería.',
      );

      return;
    }

    this.saving = true;

    const uploadedImages: UploadedBrandingImage[] = [];

    let logoUrl = this.identity?.logoUrl ?? '';
    let logoStoragePath = this.originalLogoStoragePath;

    let faviconUrl = this.identity?.faviconUrl ?? '';
    let faviconStoragePath = this.originalFaviconStoragePath;

    try {
      if (this.selectedLogo) {
        const uploaded = await this.brandingService.uploadImage(
          'logo',
          this.selectedLogo,
        );

        uploadedImages.push(uploaded);

        logoUrl = uploaded.downloadUrl;
        logoStoragePath = uploaded.fullPath;
      }

      if (this.selectedFavicon) {
        const uploaded = await this.brandingService.uploadImage(
          'favicon',
          this.selectedFavicon,
        );

        uploadedImages.push(uploaded);

        faviconUrl = uploaded.downloadUrl;
        faviconStoragePath = uploaded.fullPath;
      }

      const value = this.brandingForm.getRawValue();

      const payload = {
        storeName: value.storeName.trim(),
        tagline: value.tagline.trim(),
        logoUrl,
        logoStoragePath,
        faviconUrl,
        faviconStoragePath,
      };

      await this.brandingService.saveIdentity(payload);

      const previousLogoPath = this.originalLogoStoragePath;
      const previousFaviconPath = this.originalFaviconStoragePath;

      this.runInAngular(() => {
        this.identity = {
          ...payload,
          createdAt: this.identity?.createdAt,
        };

        this.originalLogoStoragePath = logoStoragePath;
        this.originalFaviconStoragePath = faviconStoragePath;

        this.selectedLogo = null;
        this.selectedFavicon = null;

        this.revokePreviewUrls();

        this.logoPreviewUrl = logoUrl || null;
        this.faviconPreviewUrl = faviconUrl || null;

        this.logoImageLoadFailed = false;
        this.faviconImageLoadFailed = false;

        this.notificationService.success(
          'Identidad de la florería guardada correctamente.',
        );
      });

      // Elimina las imágenes anteriores únicamente después de confirmar
      // que Firestore guardó correctamente las nuevas referencias.
      await this.deletePreviousImage(
        previousLogoPath,
        logoStoragePath,
      );

      await this.deletePreviousImage(
        previousFaviconPath,
        faviconStoragePath,
      );
    } catch (error: unknown) {
      console.error('[Branding] Error al guardar identidad:', error);

      // Si Firestore no confirmó el guardado, limpia las imágenes nuevas.
      // No se eliminan las imágenes anteriores.
      for (const uploaded of uploadedImages) {
        try {
          await this.brandingService.deleteImageByPath(
            uploaded.fullPath,
          );
        } catch (cleanupError: unknown) {
          console.error(
            '[Branding] No se pudo limpiar una imagen nueva:',
            cleanupError,
          );
        }
      }

      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible guardar la identidad de la florería.',
          ),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.saving = false;
      });
    }
  }

  resetForm(): void {
    this.brandingForm.reset({
      storeName: this.identity?.storeName ?? '',
      tagline: this.identity?.tagline ?? '',
    });

    this.revokePreviewUrls();

    this.selectedLogo = null;
    this.selectedFavicon = null;

    // Si la URL original ya falló, mantenemos el icono predeterminado.
    this.logoPreviewUrl = this.logoImageLoadFailed
      ? null
      : this.identity?.logoUrl || null;

    this.faviconPreviewUrl = this.faviconImageLoadFailed
      ? null
      : this.identity?.faviconUrl || null;
  }

  get hasChanges(): boolean {
    return (
      this.brandingForm.dirty ||
      this.selectedLogo !== null ||
      this.selectedFavicon !== null
    );
  }

  private validateImage(
    type: BrandingImageType,
    file: File,
  ): string | null {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Solo se permiten imágenes JPG, PNG o WEBP.';
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    const allowedExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
    };

    if (
      !extension ||
      !allowedExtensions[file.type]?.includes(extension)
    ) {
      return 'La extensión del archivo no coincide con su formato.';
    }

    const maxSize =
      type === 'logo'
        ? 2 * 1024 * 1024
        : 1 * 1024 * 1024;

    if (file.size > maxSize) {
      return type === 'logo'
        ? 'El logo no puede superar 2 MB.'
        : 'El favicon no puede superar 1 MB.';
    }

    return null;
  }

  private async deletePreviousImage(
    previousPath: string,
    currentPath: string,
  ): Promise<void> {
    if (!previousPath || previousPath === currentPath) {
      return;
    }

    try {
      await this.brandingService.deleteImageByPath(previousPath);
    } catch (error: unknown) {
      // El guardado ya fue confirmado. Un fallo de limpieza no debe
      // presentarse como si el guardado de identidad hubiera fallado.
      console.warn(
        '[Branding] No se pudo eliminar la imagen anterior:',
        error,
      );

      this.notificationService.warning(
        'Los cambios se guardaron, pero no se pudo eliminar una imagen anterior de Storage.',
      );
    }
  }

  private revokeLogoPreview(): void {
    if (this.logoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }
  }

  private revokeFaviconPreview(): void {
    if (this.faviconPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.faviconPreviewUrl);
    }
  }

  private revokePreviewUrls(): void {
    this.revokeLogoPreview();
    this.revokeFaviconPreview();
  }

  private runInAngular(action: () => void): void {
    this.ngZone.run(() => {
      action();
      this.changeDetectorRef.detectChanges();
    });
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
