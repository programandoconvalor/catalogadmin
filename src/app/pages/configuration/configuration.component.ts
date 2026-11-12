import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CatalogSettings,
  DEFAULT_CATALOG_SETTINGS,
} from '../../core/catalog-settings/catalog-settings.model';
import { CatalogSettingsService } from '../../core/catalog-settings/catalog-settings.service';
import { NotificationService } from '../../core/notifications/notification.service';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export class ConfigurationComponent implements OnInit {
  private readonly catalogSettingsService = inject(CatalogSettingsService);
  private readonly notificationService = inject(NotificationService);

  readonly settings = signal<CatalogSettings>({
    ...DEFAULT_CATALOG_SETTINGS,
  });

  readonly loading = signal(true);
  readonly saving = signal(false);

  private loadedFromFirestore = false;

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.loading.set(true);

    try {
      const settings = await this.catalogSettingsService.getSettings();
      this.settings.set({
        ...DEFAULT_CATALOG_SETTINGS,
        ...settings,
      });
      this.loadedFromFirestore = true;
    } catch (error) {
      console.error('[Configuration] Error al cargar configuración:', error);
      this.notificationService.error(
        this.getErrorMessage(
          error,
          'No fue posible cargar la configuración del catálogo.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  updateSetting<K extends keyof CatalogSettings>(
    key: K,
    value: CatalogSettings[K],
  ): void {
    this.settings.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  updatePrimaryColor(value: string): void {
    const normalized = value.trim().toUpperCase();

    if (!/^#[0-9A-F]{6}$/.test(normalized)) {
      return;
    }

    this.updateSetting('primaryColor', normalized);
  }

  async saveSettings(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const currentSettings = this.settings();
    const primaryColor = currentSettings.primaryColor.trim().toUpperCase();

    if (!/^#[0-9A-F]{6}$/.test(primaryColor)) {
      this.notificationService.warning(
        'Introduce un color hexadecimal válido, por ejemplo #EC4899.',
      );
      return;
    }

    this.saving.set(true);

    try {
      await this.catalogSettingsService.saveSettings(
        {
          ...currentSettings,
          primaryColor,
        },
        !this.loadedFromFirestore,
      );

      this.settings.update((current) => ({
        ...current,
        primaryColor,
      }));

      this.loadedFromFirestore = true;
      this.notificationService.success(
        'La configuración del catálogo se guardó correctamente.',
        'Configuración',
      );
    } catch (error) {
      console.error('[Configuration] Error al guardar configuración:', error);
      this.notificationService.error(
        this.getErrorMessage(
          error,
          'No fue posible guardar los cambios. Verifica tus permisos.',
        ),
        'Configuración',
      );
    } finally {
      this.saving.set(false);
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
