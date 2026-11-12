import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  ManagedPaymentMethod,
  PAYMENT_METHODS,
  PaymentMethodId,
  PaymentMethodStatus,
  StorePaymentMethod,
} from '../../core/models/payment-method.model';
import { PaymentMethodService } from '../../core/payment-methods/payment-method.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

type SortBy = 'name' | 'order';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.css',
})
export class PaymentMethodsComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly service = inject(PaymentMethodService);
  private readonly notifications = inject(NotificationService);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly options = PAYMENT_METHODS;
  readonly pageSizeOptions = [5, 10];
  methods: ManagedPaymentMethod[] = [];
  loading = false;
  saving = false;
  deleting = false;
  errorMessage: string | null = null;
  searchTerm = '';
  statusFilter: '' | 'active' | 'inactive' = '';
  sortBy: SortBy = 'order';
  sortDirection: SortDirection = 'asc';
  currentPage = 1;
  pageSize = 5;
  modalOpen = false;
  editingId: string | null = null;
  pendingDeletion: ManagedPaymentMethod | null = null;

  private readonly uniqueTypeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
    this.methods.some((item) => item.id !== this.editingId && item.type === control.value)
      ? { duplicateType: true } : null;

  private readonly uniqueOrderValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const order = Number(control.value);
    return this.methods.some((item) => item.id !== this.editingId && item.sortOrder === order)
      ? { duplicateOrder: true } : null;
  };

  private readonly integerValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
    Number.isSafeInteger(Number(control.value)) ? null : { wholeNumber: true };

  readonly paymentForm = this.fb.group({
    type: ['visa' as PaymentMethodId, [Validators.required, this.uniqueTypeValidator]],
    name: ['Visa', [Validators.required, Validators.maxLength(80)]],
    sortOrder: [1, [Validators.required, Validators.min(1), this.integerValidator, this.uniqueOrderValidator]],
    isActive: [true, Validators.required],
  });

  ngOnInit(): void { void this.loadMethods(); }

  get filteredMethods(): ManagedPaymentMethod[] {
    const term = this.searchTerm.trim().toLocaleLowerCase('es');
    return this.methods.filter((item) => {
      const label = this.methodMeta(item.type).label.toLocaleLowerCase('es');
      return (!term || item.name.toLocaleLowerCase('es').includes(term) || label.includes(term))
        && (!this.statusFilter || item.status === this.statusFilter);
    }).sort((a, b) => {
      const result = this.sortBy === 'name'
        ? a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        : a.sortOrder - b.sortOrder;
      return result * (this.sortDirection === 'asc' ? 1 : -1);
    });
  }

  get paginatedMethods(): ManagedPaymentMethod[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMethods.slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredMethods.length / this.pageSize)); }
  get firstVisibleItem(): number { return this.filteredMethods.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get lastVisibleItem(): number { return Math.min(this.currentPage * this.pageSize, this.filteredMethods.length); }
  get nextSortOrder(): number { return Math.max(0, ...this.methods.map((item) => item.sortOrder)) + 1; }
  get canCreate(): boolean { return this.methods.length < 10; }
  get hasActiveFilters(): boolean { return !!(this.searchTerm.trim() || this.statusFilter || this.sortBy !== 'order' || this.sortDirection !== 'asc'); }

  async loadMethods(): Promise<void> {
    this.loading = true; this.errorMessage = null;
    try {
      const data = await this.service.getPaymentMethods(true);
      this.run(() => { this.methods = data; });
    } catch (error) {
      const message = this.error(error, 'No fue posible cargar los métodos de pago.');
      this.run(() => { this.errorMessage = message; this.notifications.error(message); });
    } finally { this.run(() => { this.loading = false; }); }
  }

  onSearch(value: string): void { this.searchTerm = value; this.currentPage = 1; }
  onStatus(value: string): void {
    if (value !== '' && value !== 'active' && value !== 'inactive') return;
    this.statusFilter = value; this.currentPage = 1;
  }
  onSort(value: string): void {
    if (value !== 'name' && value !== 'order') return;
    this.sortBy = value; this.currentPage = 1;
  }
  toggleSort(): void { this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; }
  onPageSize(value: string): void {
    const size = Number(value); if (!this.pageSizeOptions.includes(size)) return;
    this.pageSize = size; this.currentPage = 1;
  }
  goToPage(page: number): void { this.currentPage = Math.min(Math.max(page, 1), this.totalPages); }

  openCreate(): void {
    if (!this.canCreate || this.saving) return;
    this.editingId = null;
    const option = this.availableOptions[0] ?? this.options[0];
    this.paymentForm.reset({ type: option.id, name: option.label, sortOrder: this.nextSortOrder, isActive: true });
    this.modalOpen = true;
  }

  openEdit(item: ManagedPaymentMethod): void {
    if (this.saving) return;
    this.editingId = item.id;
    this.paymentForm.reset({ type: item.type, name: item.name, sortOrder: item.sortOrder, isActive: item.isActive });
    this.modalOpen = true;
  }

  get availableOptions() {
    return this.options.filter((option) =>
      option.id === this.methods.find((item) => item.id === this.editingId)?.type
      || !this.methods.some((item) => item.id !== this.editingId && item.type === option.id));
  }

  onTypeChange(): void {
    const option = this.methodMeta(this.paymentForm.controls.type.value);
    this.paymentForm.controls.name.setValue(option.label);
    this.paymentForm.controls.type.updateValueAndValidity();
    this.paymentForm.controls.sortOrder.updateValueAndValidity();
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalOpen = false; this.editingId = null;
  }

  async saveMethod(): Promise<void> {
    if (this.saving) return;
    this.paymentForm.markAllAsTouched();
    this.paymentForm.controls.type.updateValueAndValidity();
    this.paymentForm.controls.sortOrder.updateValueAndValidity();
    if (this.paymentForm.invalid) {
      if (this.paymentForm.controls.type.hasError('duplicateType')) this.notifications.error('Este método de pago ya está configurado.');
      else if (this.paymentForm.controls.sortOrder.hasError('duplicateOrder')) this.notifications.error('Este orden ya está asignado a otro método.');
      return;
    }
    const value = this.paymentForm.getRawValue();
    const payload: StorePaymentMethod = {
      type: value.type,
      name: value.name.trim(),
      sortOrder: Number(value.sortOrder),
      isActive: value.isActive,
    };
    this.saving = true;
    try {
      if (this.editingId) {
        const id = this.editingId;
        await this.service.updatePaymentMethod(id, payload);
        const status: PaymentMethodStatus = payload.isActive ? 'active' : 'inactive';
        this.run(() => {
          this.methods = this.methods.map((item) => item.id === id
            ? { ...item, ...payload, status } : item)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          this.notifications.success('Método de pago actualizado correctamente.');
          this.modalOpen = false; this.editingId = null;
        });
      } else {
        await this.service.createPaymentMethod(payload);
        const data = await this.service.getPaymentMethods(true);
        this.run(() => {
          this.methods = data; this.currentPage = this.totalPages;
          this.notifications.success('Método de pago agregado correctamente.');
          this.modalOpen = false; this.editingId = null;
        });
      }
    } catch (error) {
      this.run(() => this.notifications.error(this.error(error, 'No fue posible guardar el método de pago.')));
    } finally { this.run(() => { this.saving = false; }); }
  }

  requestDeletion(item: ManagedPaymentMethod): void { this.pendingDeletion = item; }

  async confirmDeletion(): Promise<void> {
    const item = this.pendingDeletion; if (!item || this.deleting) return;
    this.deleting = true;
    try {
      await this.service.deletePaymentMethod(item.id);
      this.run(() => {
        this.methods = this.methods.filter((method) => method.id !== item.id);
        this.currentPage = Math.min(this.currentPage, this.totalPages);
        this.pendingDeletion = null;
        this.notifications.success('Método de pago eliminado correctamente.');
      });
    } catch (error) {
      this.run(() => this.notifications.error(this.error(error, 'No fue posible eliminar el método de pago.')));
    } finally { this.run(() => { this.deleting = false; }); }
  }

  methodMeta(type: PaymentMethodId) { return this.options.find((item) => item.id === type) ?? this.options[0]; }

  private run(action: () => void): void { this.zone.run(() => { action(); this.cdr.detectChanges(); }); }
  private error(error: unknown, fallback: string): string {
    return error instanceof Error && error.message.trim() ? error.message : fallback;
  }
}
