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
import { CategoryService } from '../../core/catalog/category.service';
import type {
  Category,
  CategoryInput,
  CategoryStatus,
} from '../../core/models/category.model';
import { NotificationService } from '../../core/notifications/notification.service';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { environment } from '../../../environments/environment';

type CategorySortBy = 'name' | 'order';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent implements OnInit {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly ngZone = inject(NgZone);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  readonly catalogId = 'normal' as const;
  readonly pageSizeOptions = [8, 12, 24, 48];

  categories: Category[] = [];

  loading = false;
  refreshing = false;
  saving = false;
  savePending = false;
  deleting = false;
  errorMessage: string | null = null;

  // Valores visibles en los controles (borrador).
  searchTerm = '';
  statusFilter: CategoryStatus | '' = '';
  sortBy: CategorySortBy = 'order';
  sortDirection: SortDirection = 'asc';

  currentPage = 1;
  pageSize = 8;

  modalOpen = false;
  editingCategoryId: string | null = null;
  pendingDeletion: Category | null = null;

  private loadPromise: Promise<void> | null = null;
  private savePendingTimer: ReturnType<typeof setTimeout> | null = null;
  private filteredCache: Category[] = [];
  private filteredCacheKey = '';
  private filteredCacheSource: Category[] | null = null;
  private readonly savePendingWarningDelayMs = 15_000;
  private lastReportedDuplicateOrder: number | null = null;
  private readonly uniqueSortOrderValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const sortOrder = Number(control.value);

    if (!Number.isInteger(sortOrder)) {
      return { wholeNumber: true };
    }

    const duplicate = this.categories.some(
      (category) =>
        category.id !== this.editingCategoryId &&
        category.sortOrder === sortOrder,
    );

    return duplicate ? { duplicateOrder: { sortOrder } } : null;
  };

  readonly categoryForm = this.formBuilder.group({
    name: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    ],
    status: ['active' as CategoryStatus, Validators.required],
    sortOrder: [
      0,
      [
        Validators.required,
        Validators.min(1),
        this.uniqueSortOrderValidator,
      ],
    ],
  });

  ngOnInit(): void {
    void this.loadCategories();
  }

  get filteredCategories(): Category[] {
    const cacheKey = [
      this.searchTerm,
      this.statusFilter,
      this.sortBy,
      this.sortDirection,
    ].join('::');

    if (
      this.categories === this.filteredCacheSource &&
      cacheKey === this.filteredCacheKey
    ) {
      return this.filteredCache;
    }

    const search = this.searchTerm.trim().toLocaleLowerCase('es');

    this.filteredCache = this.categories
      .filter((category) => {
        const name = category.name?.toLocaleLowerCase('es') ?? '';
        const matchesSearch = !search || name.includes(search);
        const matchesStatus =
          !this.statusFilter || category.status === this.statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const comparison =
          this.sortBy === 'name'
            ? (a.name ?? '').localeCompare(b.name ?? '', 'es', {
                sensitivity: 'base',
              })
            : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

        return comparison * (this.sortDirection === 'asc' ? 1 : -1);
      });

    this.filteredCacheKey = cacheKey;
    this.filteredCacheSource = this.categories;

    return this.filteredCache;
  }

  get paginatedCategories(): Category[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCategories.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredCategories.length / this.pageSize),
    );
  }

  get firstVisibleItem(): number {
    return this.filteredCategories.length
      ? (this.currentPage - 1) * this.pageSize + 1
      : 0;
  }

  get lastVisibleItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredCategories.length,
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

  async loadCategories(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    const totalStartedAt = performance.now();
    this.loading = this.categories.length === 0;
    this.errorMessage = null;

    this.loadPromise = (async () => {
      try {
        const result = await this.categoryService.getCategories(this.catalogId);

        this.runInAngular(() => {
          this.setCategories(result);
        });

        if (!environment.production) {
          console.info('[Categories Performance] Total loading:', {
            total: result.length,
            durationMs: Math.round(performance.now() - totalStartedAt),
          });
        }
      } catch (error: unknown) {
        console.error('[Categories] Error al cargar categorías:', error);
        const message = this.getErrorMessage(
          error,
          'No fue posible cargar las categorías.',
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
    this.resetFiltersAndPage();
  }

  onStatusFilterChange(value: string): void {
    if (value !== '' && value !== 'active' && value !== 'inactive') return;

    this.statusFilter = value;
    this.resetFiltersAndPage();
  }

  onSortChange(value: string): void {
    if (value === 'name' || value === 'order') {
      this.sortBy = value;
      this.resetFiltersAndPage();
    }
  }

  toggleSortDirection(): void {
    this.sortDirection =
      this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.resetFiltersAndPage();
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

  openCreateCategory(): void {
    if (this.saving || this.savePending) return;

    this.editingCategoryId = null;
    this.lastReportedDuplicateOrder = null;
    this.categoryForm.reset({
      name: '',
      status: 'active',
      sortOrder: this.nextSortOrder,
    });
    this.modalOpen = true;
  }

  get nextSortOrder(): number {
    return (
      Math.max(
        0,
        ...this.categories.map((category) =>
          Number.isInteger(category.sortOrder) ? category.sortOrder : 0,
        ),
      ) + 1
    );
  }

  toggleCategoryStatus(): void {
    const statusControl = this.categoryForm.controls.status;
    statusControl.setValue(
      statusControl.value === 'active' ? 'inactive' : 'active',
    );
  }

  openEditCategory(category: Category): void {
    if (this.saving || this.savePending) return;

    this.editingCategoryId = category.id;
    this.lastReportedDuplicateOrder = null;
    this.categoryForm.reset({
      name: category.name,
      status: category.status,
      sortOrder: category.sortOrder,
    });
    this.modalOpen = true;
    this.reportDuplicateOrder();
  }

  onSortOrderInput(): void {
    this.reportDuplicateOrder();
  }

  closeModal(): void {
    if (this.saving && !this.savePending) return;

    this.modalOpen = false;
    this.categoryForm.reset({
      name: '',
      status: 'active',
      sortOrder: 0,
    });
  }

  async saveCategory(): Promise<void> {
    if (this.saving || this.savePending) {
      return;
    }

    this.categoryForm.controls.sortOrder.updateValueAndValidity({
      emitEvent: false,
    });

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();

      const sortOrderControl = this.categoryForm.controls.sortOrder;
      if (sortOrderControl.hasError('duplicateOrder')) {
        this.reportDuplicateOrder();
      } else if (
        sortOrderControl.hasError('wholeNumber') ||
        sortOrderControl.hasError('min')
      ) {
        this.notificationService.error(
          'El orden debe ser un número entero mayor o igual a 1.',
        );
      }

      return;
    }

    const value = this.categoryForm.getRawValue();

    const payload: CategoryInput = {
      catalogId: this.catalogId,
      name: value.name.trim(),
      status: value.status,
      sortOrder: Number(value.sortOrder),
    };

    this.saving = true;
    this.savePending = false;
    this.savePendingTimer = setTimeout(() => {
      this.runInAngular(() => {
        this.saving = false;
        this.savePending = true;
        this.notificationService.warning(
          'El guardado sigue esperando respuesta de Firebase. No vuelvas a enviarlo; puedes cerrar esta ventana mientras termina.',
        );
      });
    }, this.savePendingWarningDelayMs);

    try {
      if (this.editingCategoryId) {
        const id = this.editingCategoryId;

        await this.categoryService.updateCategory(id, payload);

        this.runInAngular(() => {
          this.categories = this.categories
            .map((category) =>
              category.id === id ? { ...category, ...payload } : category,
            )
            .sort((a, b) => a.sortOrder - b.sortOrder);

          this.notificationService.success(
            'Categoría actualizada correctamente.',
          );
        });
      } else {
        const id = await this.categoryService.createCategory(payload);

        this.runInAngular(() => {
          this.categories = [...this.categories, { id, ...payload }].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          );

          this.notificationService.success(
            'Categoría creada correctamente.',
          );
        });
      }

      this.runInAngular(() => {
        this.invalidateFilteredCache();
        this.modalOpen = false;
        this.currentPage = 1;
      });
    } catch (error: unknown) {
      console.error('[Categories] Error al guardar categoría:', error);
      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible guardar la categoría.',
          ),
        );
      });
    } finally {
      if (this.savePendingTimer !== null) {
        clearTimeout(this.savePendingTimer);
        this.savePendingTimer = null;
      }

      this.runInAngular(() => {
        this.saving = false;
        this.savePending = false;
      });
    }
  }

  requestDeletion(category: Category): void {
    this.pendingDeletion = category;
  }

  async confirmDeletion(): Promise<void> {
    const category = this.pendingDeletion;

    if (!category || this.deleting) return;

    this.deleting = true;

    try {
      await this.categoryService.deleteCategory(category.id);

      this.runInAngular(() => {
        this.categories = this.categories.filter(
          (item) => item.id !== category.id,
        );

        this.invalidateFilteredCache();
        this.pendingDeletion = null;
        this.currentPage = Math.min(this.currentPage, this.totalPages);

        this.notificationService.success(
          'Categoría eliminada correctamente.',
        );
      });
    } catch (error: unknown) {
      console.error('[Categories] Error al eliminar categoría:', error);
      this.runInAngular(() => {
        this.notificationService.error(
          this.getErrorMessage(
            error,
            'No fue posible eliminar la categoría.',
          ),
        );
      });
    } finally {
      this.runInAngular(() => {
        this.deleting = false;
      });
    }
  }

  private runInAngular(action: () => void): void {
    this.ngZone.run(() => {
      action();
      this.changeDetectorRef.detectChanges();
    });
  }

  private setCategories(categories: Category[]): void {
    this.categories = Array.isArray(categories) ? categories : [];
    this.invalidateFilteredCache();
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  private invalidateFilteredCache(): void {
    this.filteredCacheKey = '';
    this.filteredCacheSource = null;
    this.filteredCache = [];
  }

  private resetFiltersAndPage(): void {
    this.currentPage = 1;
    this.invalidateFilteredCache();
  }

  private reportDuplicateOrder(): void {
    const sortOrderControl = this.categoryForm.controls.sortOrder;

    if (!sortOrderControl.hasError('duplicateOrder')) {
      this.lastReportedDuplicateOrder = null;
      return;
    }

    sortOrderControl.markAsTouched();
    const duplicateOrder = Number(sortOrderControl.value);

    if (this.lastReportedDuplicateOrder !== duplicateOrder) {
      this.lastReportedDuplicateOrder = duplicateOrder;
      this.notificationService.error(
        `El orden ${duplicateOrder} ya está asignado a otra categoría.`,
      );
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
