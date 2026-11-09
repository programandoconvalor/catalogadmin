import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  deleting = false;
  errorMessage: string | null = null;

  // Valores visibles en los controles (borrador).
  searchTerm = '';
  statusFilter: CategoryStatus | '' = '';
  sortBy: CategorySortBy = 'order';
  sortDirection: SortDirection = 'asc';

  // Valores que realmente se aplican al pulsar Filtrar.
  private appliedSearchTerm = '';
  private appliedStatusFilter: CategoryStatus | '' = '';
  private appliedSortBy: CategorySortBy = 'order';
  private appliedSortDirection: SortDirection = 'asc';

  currentPage = 1;
  pageSize = 8;

  modalOpen = false;
  editingCategoryId: string | null = null;
  pendingDeletion: Category | null = null;

  private loadPromise: Promise<void> | null = null;
  private filteredCache: Category[] = [];
  private filteredCacheKey = '';
  private filteredCacheSource: Category[] | null = null;

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
    sortOrder: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    void this.loadCategories();
  }

  get filteredCategories(): Category[] {
    const cacheKey = [
      this.appliedSearchTerm,
      this.appliedStatusFilter,
      this.appliedSortBy,
      this.appliedSortDirection,
    ].join('::');

    if (
      this.categories === this.filteredCacheSource &&
      cacheKey === this.filteredCacheKey
    ) {
      return this.filteredCache;
    }

    const search = this.appliedSearchTerm.trim().toLocaleLowerCase('es');

    this.filteredCache = this.categories
      .filter((category) => {
        const name = category.name?.toLocaleLowerCase('es') ?? '';
        const matchesSearch = !search || name.includes(search);
        const matchesStatus =
          !this.appliedStatusFilter ||
          category.status === this.appliedStatusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const comparison =
          this.appliedSortBy === 'name'
            ? (a.name ?? '').localeCompare(b.name ?? '', 'es', {
                sensitivity: 'base',
              })
            : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

        return comparison * (this.appliedSortDirection === 'asc' ? 1 : -1);
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
      this.appliedSearchTerm ||
      this.appliedStatusFilter ||
      this.appliedSortBy !== 'order' ||
      this.appliedSortDirection !== 'asc',
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

  /**
   * Aplica todos los valores del formulario de filtros.
   */
  applyFilters(): void {
    this.appliedSearchTerm = this.searchTerm.trim();
    this.appliedStatusFilter = this.statusFilter;
    this.appliedSortBy = this.sortBy;
    this.appliedSortDirection = this.sortDirection;

    this.currentPage = 1;
    this.invalidateFilteredCache();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value as CategoryStatus | '';
  }

  onSortChange(value: string): void {
    if (value === 'name' || value === 'order') {
      this.sortBy = value;
    }
  }

  toggleSortDirection(): void {
    this.sortDirection =
      this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  /**
   * Restablece tanto los controles como los filtros aplicados.
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.sortBy = 'order';
    this.sortDirection = 'asc';

    this.appliedSearchTerm = '';
    this.appliedStatusFilter = '';
    this.appliedSortBy = 'order';
    this.appliedSortDirection = 'asc';

    this.currentPage = 1;
    this.invalidateFilteredCache();
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
    this.editingCategoryId = null;
    this.categoryForm.reset({
      name: '',
      status: 'active',
      sortOrder: this.categories.length,
    });
    this.modalOpen = true;
  }

  openEditCategory(category: Category): void {
    this.editingCategoryId = category.id;
    this.categoryForm.reset({
      name: category.name,
      status: category.status,
      sortOrder: category.sortOrder,
    });
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;

    this.modalOpen = false;
    this.categoryForm.reset({
      name: '',
      status: 'active',
      sortOrder: 0,
    });
  }

  async saveCategory(): Promise<void> {
    if (this.categoryForm.invalid || this.saving) {
      this.categoryForm.markAllAsTouched();
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
      this.runInAngular(() => {
        this.saving = false;
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

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
