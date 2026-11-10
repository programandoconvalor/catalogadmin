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

import {
  EditableSocialNetworkId,
  ManagedStoreSocialNetwork,
  SOCIAL_NETWORKS,
  SOCIAL_NETWORK_CATALOG_ID,
  StoreSocialNetworkId,
  StoreSocialNetworkStatus,
} from '../../core/models/social-network.model';
import {
  getSocialNetworkUrlError,
  SocialNetworkService,
  StoreSocialNetworkInput,
} from '../../core/social-networks/social-network.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

type SocialNetworkSortBy = 'name' | 'order';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-social-networks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './social-networks.component.html',
  styleUrl: './social-networks.component.css',
})
export class SocialNetworksComponent implements OnInit {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly ngZone = inject(NgZone);
  private readonly socialNetworkService = inject(SocialNetworkService);
  private readonly notificationService = inject(NotificationService);

  readonly socialNetworkOptions = SOCIAL_NETWORKS;
  readonly formSocialNetworkOptions = this.socialNetworkOptions;
  readonly maximumNetworks = 5;
  readonly pageSizeOptions = [2, 3, 5];

  networks: ManagedStoreSocialNetwork[] = [];
  loading = false;
  saving = false;
  deleting = false;
  errorMessage: string | null = null;
  searchTerm = '';
  statusFilter: StoreSocialNetworkStatus | '' = '';
  sortBy: SocialNetworkSortBy = 'order';
  sortDirection: SortDirection = 'asc';
  currentPage = 1;
  pageSize = 5;
  modalOpen = false;
  editingNetworkId: string | null = null;
  pendingDeletion: ManagedStoreSocialNetwork | null = null;

  private loadPromise: Promise<void> | null = null;

  private readonly integerOrderValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null =>
    Number.isSafeInteger(Number(control.value)) ? null : { wholeNumber: true };

  private readonly uniqueNetworkValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const network = control.value;
    if (!this.isSocialNetworkId(network)) return null;

    return this.networks.some(
      (item) =>
        item.id !== this.editingNetworkId && item.network === network,
    )
      ? { duplicateNetwork: true }
      : null;
  };

  private readonly supportedNetworkValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null =>
    this.formSocialNetworkOptions.some(({ id }) => id === control.value)
      ? null
      : { unsupportedNetwork: true };

  private readonly uniqueOrderValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const order = Number(control.value);
    if (!Number.isSafeInteger(order)) return null;

    return this.networks.some(
      (item) =>
        item.id !== this.editingNetworkId && item.sortOrder === order,
    )
      ? { duplicateOrder: true }
      : null;
  };

  private readonly profileUrlValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const network = control.parent?.get('network')?.value;
    if (!this.isSocialNetworkId(network) || !control.value) return null;

    const message = getSocialNetworkUrlError(network, String(control.value));
    return message ? { profileUrl: { message } } : null;
  };

  readonly socialForm = this.formBuilder.group({
    network: [
      'facebook' as StoreSocialNetworkId,
      [
        Validators.required,
        this.supportedNetworkValidator,
        this.uniqueNetworkValidator,
      ],
    ],
    url: ['', [Validators.required, this.profileUrlValidator]],
    sortOrder: [
      1,
      [
        Validators.required,
        Validators.min(1),
        this.integerOrderValidator,
        this.uniqueOrderValidator,
      ],
    ],
    status: ['active' as StoreSocialNetworkStatus, Validators.required],
  });

  ngOnInit(): void {
    void this.loadNetworks();
  }

  get filteredNetworks(): ManagedStoreSocialNetwork[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('es');
    return this.networks
      .filter((network) => {
        const label = this.networkLabel(network.network).toLocaleLowerCase('es');
        return (
          (!search ||
            label.includes(search) ||
            network.url.toLocaleLowerCase('es').includes(search)) &&
          (!this.statusFilter || network.status === this.statusFilter)
        );
      })
      .sort((first, second) => {
        const comparison =
          this.sortBy === 'name'
            ? this.networkLabel(first.network).localeCompare(
                this.networkLabel(second.network),
                'es',
                { sensitivity: 'base' },
              )
            : first.sortOrder - second.sortOrder;

        return comparison * (this.sortDirection === 'asc' ? 1 : -1);
      });
  }

  get paginatedNetworks(): ManagedStoreSocialNetwork[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredNetworks.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredNetworks.length / this.pageSize));
  }

  get firstVisibleItem(): number {
    return this.filteredNetworks.length
      ? (this.currentPage - 1) * this.pageSize + 1
      : 0;
  }

  get lastVisibleItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredNetworks.length,
    );
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm.trim() ||
        this.statusFilter ||
        this.sortBy !== 'order' ||
        this.sortDirection !== 'asc',
    );
  }

  get activeNetworks(): ManagedStoreSocialNetwork[] {
    return this.networks
      .filter((network) => network.status === 'active')
      .sort((first, second) => first.sortOrder - second.sortOrder);
  }

  get nextSortOrder(): number {
    return (
      Math.max(0, ...this.networks.map((network) => network.sortOrder)) + 1
    );
  }

  get canCreateNetwork(): boolean {
    return this.networks.length < this.maximumNetworks;
  }

  async loadNetworks(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loading = this.networks.length === 0;
    this.errorMessage = null;
    this.loadPromise = (async () => {
      try {
        const result = await this.socialNetworkService.getSocialNetworks(
          SOCIAL_NETWORK_CATALOG_ID,
        );
        this.runInAngular(() => {
          this.networks = [...result].sort(
            (first, second) => first.sortOrder - second.sortOrder,
          );
        });
      } catch (error: unknown) {
        console.error('[SocialNetworks] Error al cargar redes sociales:', error);
        const message = this.getErrorMessage(
          error,
          'No fue posible cargar las redes sociales.',
        );
        this.runInAngular(() => {
          this.errorMessage = message;
          this.notificationService.error(message);
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
    if (value !== '' && value !== 'active' && value !== 'inactive') return;

    this.statusFilter = value;
    this.currentPage = 1;
  }

  onSortChange(value: string): void {
    if (value !== 'name' && value !== 'order') return;

    this.sortBy = value;
    this.currentPage = 1;
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.currentPage = 1;
  }

  onPageSizeChange(value: string): void {
    const size = Number(value);
    if (!this.pageSizeOptions.includes(size)) return;

    this.pageSize = size;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  openCreateNetwork(): void {
    if (this.saving || !this.canCreateNetwork) return;

    this.editingNetworkId = null;
    this.socialForm.reset({
      network: this.availableNetworkOptions[0]?.id ?? 'facebook',
      url: '',
      sortOrder: this.nextSortOrder,
      status: 'active',
    });
    this.modalOpen = true;
  }

  openEditNetwork(network: ManagedStoreSocialNetwork): void {
    if (this.saving || !this.canEditNetwork(network)) return;

    this.editingNetworkId = network.id;
    this.socialForm.reset({
      network: network.network,
      url: network.url,
      sortOrder: network.sortOrder,
      status: network.status,
    });
    this.modalOpen = true;
    this.validateNetworkFields();
  }

  get availableNetworkOptions() {
    return this.formSocialNetworkOptions.filter(
      ({ id }) =>
        id === this.networks.find(
          (network) => network.id === this.editingNetworkId,
        )?.network ||
        !this.networks.some(
          (network) =>
            network.id !== this.editingNetworkId && network.network === id,
        ),
    );
  }

  canEditNetwork(network: ManagedStoreSocialNetwork): boolean {
    return this.isSocialNetworkId(network.network);
  }

  onNetworkChange(): void {
    this.validateNetworkFields();
  }

  toggleNetworkStatus(): void {
    const statusControl = this.socialForm.controls.status;
    statusControl.setValue(
      statusControl.value === 'active' ? 'inactive' : 'active',
    );
  }

  closeModal(): void {
    if (this.saving) return;

    this.modalOpen = false;
    this.socialForm.reset({
      network: 'facebook',
      url: '',
      sortOrder: 1,
      status: 'active',
    });
  }

  async saveNetwork(): Promise<void> {
    if (this.saving) return;

    this.validateNetworkFields();
    if (this.socialForm.invalid) {
      this.socialForm.markAllAsTouched();
      this.notifyFormError();
      return;
    }

    const value = this.socialForm.getRawValue();
    if (!this.isEditableSocialNetworkId(value.network)) {
      this.notificationService.error('Selecciona una red social válida.');
      return;
    }

    const payload: StoreSocialNetworkInput = {
      network: value.network,
      url: value.url.trim(),
      sortOrder: Number(value.sortOrder),
      status: value.status,
    };

    this.saving = true;
    try {
      const originalNetwork = this.editingNetworkId;
      if (originalNetwork) {
        await this.socialNetworkService.updateSocialNetwork(
          SOCIAL_NETWORK_CATALOG_ID,
          originalNetwork,
          payload,
        );
        this.runInAngular(() => {
          this.networks = this.networks
            .map((network) =>
              network.id === originalNetwork
                ? {
                    ...network,
                    ...payload,
                    id:
                      network.id !== 'socials' &&
                      payload.network !== network.network
                        ? payload.network
                        : network.id,
                  }
                : network,
            )
            .sort((first, second) => first.sortOrder - second.sortOrder);
          this.notificationService.success(
            'Red social actualizada correctamente.',
          );
          this.modalOpen = false;
          this.editingNetworkId = null;
        });
      } else {
        await this.socialNetworkService.createSocialNetwork(
          SOCIAL_NETWORK_CATALOG_ID,
          payload,
        );
        this.runInAngular(() => {
          this.networks = [
            ...this.networks,
            {
              ...payload,
              id: payload.network,
              catalogId: SOCIAL_NETWORK_CATALOG_ID,
            },
          ].sort(
            (first, second) => first.sortOrder - second.sortOrder,
          );
          this.currentPage = this.totalPages;
          this.notificationService.success(
            'Red social agregada correctamente.',
          );
          this.modalOpen = false;
          this.editingNetworkId = null;
        });
      }
    } catch (error: unknown) {
      console.error('[SocialNetworks] Error al guardar red social:', error);
      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(error, 'No fue posible guardar la red social.'),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.saving = false;
      });
    }
  }

  requestDeletion(network: ManagedStoreSocialNetwork): void {
    this.pendingDeletion = network;
  }

  async confirmDeletion(): Promise<void> {
    const network = this.pendingDeletion;
    if (!network || this.deleting) return;

    this.deleting = true;
    try {
      await this.socialNetworkService.deleteSocialNetwork(
        SOCIAL_NETWORK_CATALOG_ID,
        network.id,
      );
      this.runInAngular(() => {
        this.networks = this.networks.filter(
          (item) => item.id !== network.id,
        );
        this.currentPage = Math.min(this.currentPage, this.totalPages);
        this.pendingDeletion = null;
        this.notificationService.success(
          'Red social eliminada correctamente.',
        );
      });
    } catch (error: unknown) {
      console.error('[SocialNetworks] Error al eliminar red social:', error);
      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(error, 'No fue posible eliminar la red social.'),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.deleting = false;
      });
    }
  }

  networkLabel(network: StoreSocialNetworkId): string {
    return (
      this.socialNetworkOptions.find((item) => item.id === network)?.label ??
      network
    );
  }

  networkDescription(network: StoreSocialNetworkId): string {
    return {
      facebook: 'Página de Facebook',
      instagram: 'Perfil de Instagram',
      whatsapp: 'Enlace de WhatsApp',
      tiktok: 'Perfil de TikTok',
      youtube: 'Canal de YouTube',
    }[network];
  }

  exampleUrl(network: StoreSocialNetworkId): string {
    return {
      facebook: 'https://facebook.com/tufloreria',
      instagram: 'https://instagram.com/tufloreria',
      whatsapp: 'https://wa.me/521234567890',
      tiktok: 'https://tiktok.com/@tufloreria',
      youtube: 'https://youtube.com/@tufloreria',
    }[network];
  }

  networkMeta(network: StoreSocialNetworkId) {
    return (
      this.socialNetworkOptions.find((item) => item.id === network) ??
      this.socialNetworkOptions[0]
    );
  }

  private validateNetworkFields(): void {
    this.socialForm.controls.network.updateValueAndValidity({
      emitEvent: false,
    });
    this.socialForm.controls.url.updateValueAndValidity({ emitEvent: false });
    this.socialForm.controls.sortOrder.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private notifyFormError(): void {
    const { network, url, sortOrder } = this.socialForm.controls;

    if (network.hasError('duplicateNetwork')) {
      this.notificationService.error(
        `${this.networkLabel(network.value)} ya está configurada.`,
      );
    } else if (url.hasError('profileUrl')) {
      const error: unknown = url.getError('profileUrl');
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        this.notificationService.error(error.message);
      }
    } else if (sortOrder.hasError('duplicateOrder')) {
      this.notificationService.error(
        `El orden ${sortOrder.value} ya está asignado a otra red social.`,
      );
    }
  }

  private isSocialNetworkId(value: unknown): value is StoreSocialNetworkId {
    return this.socialNetworkOptions.some(({ id }) => id === value);
  }

  private isEditableSocialNetworkId(
    value: unknown,
  ): value is EditableSocialNetworkId {
    return this.formSocialNetworkOptions.some(({ id }) => id === value);
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
