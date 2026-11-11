
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

import { DeliveryZoneService } from '../../../core/catalog/delivery-zone.service';
import type {
  DeliveryZone,
  DeliveryZoneInput,
} from '../../../core/models/delivery-zone.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';

type SortBy = 'name' | 'order';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-delivery-zones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './delivery-zones.component.html',
  styleUrl: './delivery-zones.component.css',
})
export class DeliveryZonesComponent implements OnInit {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly ngZone = inject(NgZone);
  private readonly deliveryZoneService = inject(DeliveryZoneService);
  private readonly notificationService = inject(NotificationService);

  readonly maximumZones = 5;
  readonly pageSizeOptions = [5, 10, 20];

  zones: DeliveryZone[] = [];

  loading = false;
  saving = false;
  deleting = false;
  errorMessage: string | null = null;

  searchTerm = '';
  statusFilter: 'active' | 'inactive' | '' = '';
  sortBy: SortBy = 'order';
  sortDirection: SortDirection = 'asc';

  currentPage = 1;
  pageSize = 5;

  modalOpen = false;
  editingZoneId: string | null = null;
  pendingDeletion: DeliveryZone | null = null;

  private loadPromise: Promise<void> | null = null;

  private readonly integerOrderValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null =>
    Number.isSafeInteger(Number(control.value))
      ? null
      : { wholeNumber: true };

  private readonly uniqueOrderValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const order = Number(control.value);

    if (!Number.isSafeInteger(order)) return null;

    return this.zones.some(
      (zone) =>
        zone.id !== this.editingZoneId &&
        zone.sortOrder === order,
    )
      ? { duplicateOrder: true }
      : null;
  };

  readonly zoneForm = this.formBuilder.group({
    zoneName: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    ],
    shippingCost: [null as number | null, [Validators.min(0)]],
    deliveryTime: ['', [Validators.maxLength(100)]],
    isActive: [true, Validators.required],
    sortOrder: [
      1,
      [
        Validators.required,
        Validators.min(1),
        this.integerOrderValidator,
        this.uniqueOrderValidator,
      ],
    ],
  });

  ngOnInit(): void {
    void this.loadZones();
  }

  get filteredZones(): DeliveryZone[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('es');

    return this.zones
      .filter((zone) => {
        const matchesSearch =
          !search ||
          zone.zoneName.toLocaleLowerCase('es').includes(search);

        const matchesStatus =
          !this.statusFilter ||
          (this.statusFilter === 'active'
            ? zone.isActive
            : !zone.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        const comparison =
          this.sortBy === 'name'
            ? first.zoneName.localeCompare(second.zoneName, 'es', {
                sensitivity: 'base',
              })
            : first.sortOrder - second.sortOrder;

        return comparison * (this.sortDirection === 'asc' ? 1 : -1);
      });
  }

  get paginatedZones(): DeliveryZone[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredZones.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredZones.length / this.pageSize),
    );
  }

  get firstVisibleItem(): number {
    return this.filteredZones.length
      ? (this.currentPage - 1) * this.pageSize + 1
      : 0;
  }

  get lastVisibleItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredZones.length,
    );
  }

  get activeZonesCount(): number {
    return this.zones.filter((zone) => zone.isActive).length;
  }

  get inactiveZonesCount(): number {
    return this.zones.filter((zone) => !zone.isActive).length;
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm.trim() ||
      this.statusFilter ||
      this.sortBy !== 'order' ||
      this.sortDirection !== 'asc',
    );
  }

  get canCreateZone(): boolean {
    return this.zones.length < this.maximumZones;
  }

  get nextSortOrder(): number {
    return (
      Math.max(
        0,
        ...this.zones.map((zone) =>
          Number.isInteger(zone.sortOrder) ? zone.sortOrder : 0,
        ),
      ) + 1
    );
  }

  async loadZones(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loading = this.zones.length === 0;
    this.errorMessage = null;

    this.loadPromise = (async () => {
      try {
        const result = await this.deliveryZoneService.getDeliveryZones();

        this.runInAngular(() => {
          this.zones = result;
          this.currentPage = Math.min(this.currentPage, this.totalPages);
          this.zoneForm.controls.sortOrder.updateValueAndValidity({
            emitEvent: false,
          });
        });
      } catch (error: unknown) {
        console.error(
          '[DeliveryZones] Error al cargar zonas:',
          error,
        );

        this.runInAngular(() => {
          this.errorMessage = this.getErrorMessage(
            error,
            'No fue posible cargar las zonas de entrega.',
          );
          this.notificationService.error(this.errorMessage);
        });
      } finally {
        this.runInAngular(() => {
          this.loading = false;
          this.loadPromise = null;
        });
      }
    })();

    return this.loadPromise;
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  onStatusFilterChange(value: string): void {
    if (value !== '' && value !== 'active' && value !== 'inactive') {
      return;
    }

    this.statusFilter = value;
    this.currentPage = 1;
  }

  onSortChange(value: string): void {
    if (value === 'name' || value === 'order') {
      this.sortBy = value;
      this.currentPage = 1;
    }
  }

  toggleSortDirection(): void {
    this.sortDirection =
      this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  onPageSizeChange(value: string): void {
    const size = Number(value);

    if (!this.pageSizeOptions.includes(size)) return;

    this.pageSize = size;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(
      Math.max(page, 1),
      this.totalPages,
    );
  }

  openCreateZone(): void {
    if (this.saving || !this.canCreateZone) {
      if (!this.canCreateZone) {
        this.notificationService.warning(
          'Ya alcanzaste el máximo de 5 zonas de entrega.',
        );
      }
      return;
    }

    this.editingZoneId = null;

    this.zoneForm.reset({
      zoneName: '',
      shippingCost: null,
      deliveryTime: '',
      isActive: true,
      sortOrder: this.nextSortOrder,
    });

    this.modalOpen = true;
  }

  openEditZone(zone: DeliveryZone): void {
    if (this.saving) return;

    this.editingZoneId = zone.id;

    this.zoneForm.reset({
      zoneName: zone.zoneName,
      shippingCost: zone.shippingCost ?? null,
      deliveryTime: zone.deliveryTime ?? '',
      isActive: zone.isActive,
      sortOrder: zone.sortOrder,
    });

    this.modalOpen = true;
  }

  toggleZoneStatus(): void {
    const control = this.zoneForm.controls.isActive;
    control.setValue(!control.value);
  }

  onSortOrderInput(): void {
    this.zoneForm.controls.sortOrder.updateValueAndValidity();
  }

  closeModal(): void {
    if (this.saving) return;

    this.modalOpen = false;
    this.editingZoneId = null;
  }

  async saveZone(): Promise<void> {
    if (this.saving) return;

    this.zoneForm.controls.sortOrder.updateValueAndValidity();

    if (this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();

      if (this.zoneForm.controls.sortOrder.hasError('duplicateOrder')) {
        this.notificationService.error(
          'Este orden ya está asignado a otra zona.',
        );
      }

      return;
    }

    if (!this.editingZoneId && !this.canCreateZone) {
      this.notificationService.warning(
        'Solo puedes registrar un máximo de 5 zonas de entrega.',
      );
      return;
    }

    const value = this.zoneForm.getRawValue();

    const payload: DeliveryZoneInput = {
      zoneName: value.zoneName.trim(),
      isActive: value.isActive,
      sortOrder: Number(value.sortOrder),
      ...(value.shippingCost !== null &&
      value.shippingCost !== undefined
        ? { shippingCost: Number(value.shippingCost) }
        : {}),
      ...(value.deliveryTime.trim()
        ? { deliveryTime: value.deliveryTime.trim() }
        : {}),
    };

    this.saving = true;

    try {
      if (this.editingZoneId) {
        const id = this.editingZoneId;

        await this.deliveryZoneService.updateDeliveryZone(id, payload);

        this.runInAngular(() => {
          this.zones = this.zones
            .map((zone) =>
              zone.id === id
                ? {
                    ...zone,
                    zoneName: payload.zoneName ?? payload.name ?? zone.zoneName,
                    name: payload.zoneName ?? payload.name ?? zone.name,
                    shippingCost: payload.shippingCost ?? null,
                    deliveryTime: payload.deliveryTime ?? null,
                    isActive: payload.isActive ?? (payload.status === 'active'),
                    status: (payload.isActive ?? (payload.status === 'active'))
                      ? ('active' as const)
                      : ('inactive' as const),
                    sortOrder: payload.sortOrder,
                  }
                : zone,
            )
            .sort((a, b) => a.sortOrder - b.sortOrder);

          this.notificationService.success(
            'Zona de entrega actualizada correctamente.',
          );
        });
      } else {
        const id =
          await this.deliveryZoneService.createDeliveryZone(payload);

        this.runInAngular(() => {
          const createdZone: DeliveryZone = {
            id,
            zoneName: payload.zoneName ?? '',
            name: payload.zoneName ?? payload.name ?? '',
            shippingCost: payload.shippingCost ?? null,
            deliveryTime: payload.deliveryTime ?? null,
            isActive: payload.isActive ?? (payload.status === 'active'),
            status: (payload.isActive ?? (payload.status === 'active'))
              ? ('active' as const)
              : ('inactive' as const),
            sortOrder: payload.sortOrder,
            ...(payload.catalogId ? { catalogId: payload.catalogId } : {}),
            ...(payload.description ? { description: payload.description } : {}),
          };

          this.zones = [...this.zones, createdZone].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          );

          this.notificationService.success(
            'Zona de entrega creada correctamente.',
          );
        });
      }

      this.runInAngular(() => {
        this.modalOpen = false;
        this.editingZoneId = null;
        this.currentPage = 1;
        this.zoneForm.controls.sortOrder.updateValueAndValidity();
      });
    } catch (error: unknown) {
      console.error(
        '[DeliveryZones] Error al guardar zona:',
        error,
      );

      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible guardar la zona de entrega.',
          ),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.saving = false;
      });
    }
  }

  requestDeletion(zone: DeliveryZone): void {
    this.pendingDeletion = zone;
  }

  async confirmDeletion(): Promise<void> {
    const zone = this.pendingDeletion;

    if (!zone || this.deleting) return;

    this.deleting = true;

    try {
      await this.deliveryZoneService.deleteDeliveryZone(zone.id);

      this.runInAngular(() => {
        this.zones = this.zones.filter(
          (item) => item.id !== zone.id,
        );

        this.pendingDeletion = null;
        this.currentPage = Math.min(this.currentPage, this.totalPages);

        this.zoneForm.controls.sortOrder.updateValueAndValidity();

        this.notificationService.success(
          'Zona de entrega eliminada correctamente.',
        );
      });
    } catch (error: unknown) {
      console.error(
        '[DeliveryZones] Error al eliminar zona:',
        error,
      );

      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible eliminar la zona de entrega.',
          ),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.deleting = false;
      });
    }
  }

  async toggleStatus(zone: DeliveryZone): Promise<void> {
    try {
      await this.deliveryZoneService.updateZoneStatus(
        zone.id,
        !zone.isActive,
      );

      this.runInAngular(() => {
        this.zones = this.zones.map((item) =>
          item.id === zone.id
            ? { ...item, isActive: !item.isActive }
            : item,
        );

        this.notificationService.success(
          zone.isActive
            ? 'Zona desactivada correctamente.'
            : 'Zona activada correctamente.',
        );
      });
    } catch (error: unknown) {
      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible cambiar el estado de la zona.',
          ),
        );
      });
    }
  }

  formatShippingCost(cost?: number | null): string {
    if (cost === undefined || cost === null) return 'Por definir';

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(cost);
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
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
