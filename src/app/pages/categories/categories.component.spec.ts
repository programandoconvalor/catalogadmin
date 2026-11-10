/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';

import { CategoryService } from '../../core/catalog/category.service';
import type {
  Category,
  CategoryInput,
} from '../../core/models/category.model';
import { NotificationService } from '../../core/notifications/notification.service';
import { CategoriesComponent } from './categories.component';

describe('CategoriesComponent', () => {
  let fixture: ComponentFixture<CategoriesComponent>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let ngZone: NgZone;

  const category: Category = {
    id: 'category-1',
    catalogId: 'normal',
    name: 'Rosas',
    status: 'active',
    sortOrder: 1,
  };

  beforeEach(async () => {
    spyOn(console, 'error');

    categoryService = jasmine.createSpyObj<CategoryService>(
      'CategoryService',
      ['getCategories', 'createCategory', 'updateCategory', 'deleteCategory'],
    );
    notificationService = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['success', 'error', 'warning', 'info', 'dismiss'],
    );
    categoryService.getCategories.and.resolveTo([category]);

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent],
      providers: [
        { provide: CategoryService, useValue: categoryService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compileComponents();

    ngZone = TestBed.inject(NgZone);
    fixture = TestBed.createComponent(CategoriesComponent);
  });

  it('renders categories after an asynchronous response outside Angular', async () => {
    categoryService.getCategories.and.returnValue(
      new Promise((resolve) => {
        ngZone.runOutsideAngular(() => {
          setTimeout(() => resolve([category]), 0);
        });
      }),
    );

    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rosas');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Cargando categorías...',
    );
    expect(categoryService.getCategories).toHaveBeenCalledOnceWith('normal');
  });

  it('shows the error state and clears loading when the request fails', async () => {
    categoryService.getCategories.and.rejectWith(
      new Error('No fue posible consultar Firestore.'),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No fue posible consultar Firestore.',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Cargando categorías...',
    );
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'No fue posible consultar Firestore.',
    );
  });

  it('filters and sorts loaded categories immediately without reloading them', async () => {
    const categories: Category[] = Array.from({ length: 10 }, (_, index) => ({
      id: `category-${index}`,
      catalogId: 'normal',
      name: `Categoría ${index}`,
      status: index % 2 === 0 ? 'active' : 'inactive',
      sortOrder: 10 - index,
    }));
    categoryService.getCategories.and.resolveTo(categories);

    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.pageSize = 2;
    component.goToPage(4);
    component.onSearchChange('Categoría 8');

    expect(component.currentPage).toBe(1);
    expect(component.filteredCategories.map(({ id }) => id)).toEqual([
      'category-8',
    ]);
    expect(component.totalPages).toBe(1);
    expect(component.firstVisibleItem).toBe(1);
    expect(component.lastVisibleItem).toBe(1);

    component.onSearchChange('Categoría');
    component.onStatusFilterChange('active');
    component.onSortChange('name');
    component.toggleSortDirection();

    expect(component.filteredCategories).toHaveSize(5);
    expect(component.paginatedCategories.map(({ id }) => id)).toEqual([
      'category-8',
      'category-6',
    ]);
    expect(component.currentPage).toBe(1);
    expect(component.totalPages).toBe(3);
    expect(component.firstVisibleItem).toBe(1);
    expect(component.lastVisibleItem).toBe(2);
    expect(categoryService.getCategories).toHaveBeenCalledOnceWith('normal');

    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector(
      '.category-toolbar',
    ) as HTMLElement;
    expect(toolbar.textContent).not.toContain('Filtrar');
    expect(toolbar.textContent).not.toContain('Limpiar');
  });

  it('sets the next category order and updates status through the switch', () => {
    const component = fixture.componentInstance;
    component.categories = Array.from({ length: 5 }, (_, index) => ({
      ...category,
      id: `category-${index}`,
      sortOrder: index + 1,
    }));

    component.openCreateCategory();
    fixture.detectChanges();

    expect(component.categoryForm.controls.sortOrder.value).toBe(6);
    expect(component.categoryForm.controls.status.value).toBe('active');

    const statusSwitch = fixture.nativeElement.querySelector(
      '.category-switch-input',
    ) as HTMLInputElement;
    expect(statusSwitch.checked).toBeTrue();

    statusSwitch.click();
    fixture.detectChanges();
    const updatedStatusSwitch = fixture.nativeElement.querySelector(
      '.category-switch-input',
    ) as HTMLInputElement;
    expect(updatedStatusSwitch.checked).toBeFalse();
    expect(component.categoryForm.controls.status.value).toBe('inactive');

    component.categories = Array.from({ length: 10 }, (_, index) => ({
      ...category,
      id: `category-${index}`,
      sortOrder: index + 1,
    }));
    component.openCreateCategory();

    expect(component.categoryForm.controls.sortOrder.value).toBe(11);
    expect(component.categoryForm.controls.status.value).toBe('active');
  });

  it('keeps the existing status and order when editing a category', () => {
    const component = fixture.componentInstance;
    component.openEditCategory({
      ...category,
      status: 'inactive',
      sortOrder: 4,
    });

    expect(component.categoryForm.controls.sortOrder.value).toBe(4);
    expect(component.categoryForm.controls.status.value).toBe('inactive');
  });

  it('uses the next unused consecutive order when existing categories repeat an order', () => {
    const component = fixture.componentInstance;
    component.categories = [
      category,
      { ...category, id: 'category-2', name: 'Gerberas', sortOrder: 1 },
    ];

    component.openCreateCategory();

    expect(component.categoryForm.controls.sortOrder.value).toBe(2);
  });

  it('rejects duplicate order on create with form and toast errors', async () => {
    const component = fixture.componentInstance;
    component.categories = [category];
    component.openCreateCategory();
    component.categoryForm.patchValue({ name: 'Gerberas' });
    fixture.detectChanges();

    const sortOrderInput = fixture.nativeElement.querySelector(
      'input[formControlName="sortOrder"]',
    ) as HTMLInputElement;
    sortOrderInput.value = '1';
    sortOrderInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    await component.saveCategory();

    expect(categoryService.createCategory).not.toHaveBeenCalled();
    expect(component.modalOpen).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('.category-input-group em')
        ?.textContent,
    ).toContain('Este orden ya está asignado');
    expect(component.categoryForm.controls.sortOrder.hasError('duplicateOrder'))
      .toBeTrue();
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'El orden 1 ya está asignado a otra categoría.',
    );
  });

  it('rejects duplicate order on update but allows keeping its own order', async () => {
    const component = fixture.componentInstance;
    const secondCategory: Category = {
      ...category,
      id: 'category-2',
      name: 'Gerberas',
      sortOrder: 2,
    };
    component.categories = [category, secondCategory];
    component.openEditCategory(secondCategory);
    component.categoryForm.patchValue({ sortOrder: 1 });

    await component.saveCategory();

    expect(categoryService.updateCategory).not.toHaveBeenCalled();
    expect(component.categoryForm.controls.sortOrder.hasError('duplicateOrder'))
      .toBeTrue();
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'El orden 1 ya está asignado a otra categoría.',
    );

    component.categoryForm.patchValue({ sortOrder: 2 });
    expect(component.categoryForm.controls.sortOrder.valid).toBeTrue();
  });

  it('requires a positive whole-number order', async () => {
    const component = fixture.componentInstance;
    component.openCreateCategory();
    component.categoryForm.patchValue({
      name: 'Gerberas',
      sortOrder: 1.5,
    });

    await component.saveCategory();

    expect(categoryService.createCategory).not.toHaveBeenCalled();
    expect(component.categoryForm.controls.sortOrder.hasError('wholeNumber'))
      .toBeTrue();
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'El orden debe ser un número entero mayor o igual a 1.',
    );
  });

  it('creates ten categories locally with consecutive orders and normal catalog payloads', async () => {
    const component = fixture.componentInstance;
    categoryService.getCategories.and.resolveTo([]);
    fixture.detectChanges();
    await fixture.whenStable();

    let createdCount = 0;
    categoryService.createCategory.and.callFake(
      async (_payload: CategoryInput) => `created-${++createdCount}`,
    );

    for (let index = 0; index < 10; index += 1) {
      component.openCreateCategory();
      component.categoryForm.patchValue({
        name: `Category ${index + 1}`,
        status: index % 2 === 0 ? 'active' : 'inactive',
        sortOrder: index + 1,
      });

      await component.saveCategory();
    }

    expect(categoryService.createCategory).toHaveBeenCalledTimes(10);
    expect(categoryService.getCategories).toHaveBeenCalledOnceWith('normal');
    expect(component.categories).toHaveSize(10);
    expect(component.categories.map(({ sortOrder }) => sortOrder)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(component.categories[9]).toEqual({
      id: 'created-10',
      catalogId: 'normal',
      name: 'Category 10',
      status: 'inactive',
      sortOrder: 10,
    });
    expect(component.modalOpen).toBeFalse();
    expect(component.saving).toBeFalse();
    expect(notificationService.success).toHaveBeenCalledTimes(10);
  });

  it('updates a category with trimmed data and resorts the in-memory list', async () => {
    const component = fixture.componentInstance;
    const secondCategory: Category = {
      ...category,
      id: 'category-2',
      name: 'Tulipanes',
      sortOrder: 2,
    };
    component.categories = [category, secondCategory];
    component.openEditCategory(category);
    component.categoryForm.patchValue({
      name: '  Rosas premium  ',
      status: 'inactive',
      sortOrder: 3,
    });

    await component.saveCategory();

    expect(categoryService.updateCategory).toHaveBeenCalledOnceWith(
      'category-1',
      {
        catalogId: 'normal',
        name: 'Rosas premium',
        status: 'inactive',
        sortOrder: 3,
      },
    );
    expect(component.categories.map(({ id }) => id)).toEqual([
      'category-2',
      'category-1',
    ]);
    expect(component.categories[1].name).toBe('Rosas premium');
    expect(component.categories[1].status).toBe('inactive');
    expect(component.modalOpen).toBeFalse();
    expect(component.saving).toBeFalse();
    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Categoría actualizada correctamente.',
    );
  });

  it('rejects invalid form submissions without calling the create service', async () => {
    const component = fixture.componentInstance;
    component.openCreateCategory();
    component.categoryForm.patchValue({ name: '   ', sortOrder: -1 });

    await component.saveCategory();

    expect(categoryService.createCategory).not.toHaveBeenCalled();
    expect(categoryService.updateCategory).not.toHaveBeenCalled();
    expect(component.categoryForm.controls.name.touched).toBeTrue();
    expect(component.categoryForm.controls.sortOrder.invalid).toBeTrue();
    expect(component.modalOpen).toBeTrue();
  });

  it('keeps the form open and clears the saving state when creation fails', async () => {
    const component = fixture.componentInstance;
    component.openCreateCategory();
    component.categoryForm.patchValue({
      name: 'Nueva categoría',
      sortOrder: 1,
    });
    categoryService.createCategory.and.rejectWith(
      new Error('No fue posible guardar la categoría.'),
    );

    await component.saveCategory();

    expect(component.categories).toEqual([]);
    expect(component.modalOpen).toBeTrue();
    expect(component.saving).toBeFalse();
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'No fue posible guardar la categoría.',
    );
  });

  it('surfaces a slow save, prevents duplicate submissions, and applies its result when it completes', async () => {
    const component = fixture.componentInstance;
    let resolveCreated!: (id: string) => void;
    categoryService.createCategory.and.returnValue(
      new Promise((resolve) => {
        resolveCreated = resolve;
      }),
    );
    component.openCreateCategory();
    component.categoryForm.patchValue({
      name: 'Nueva categoría',
      sortOrder: 1,
    });

    jasmine.clock().install();
    try {
      const savePromise = component.saveCategory();
      jasmine.clock().tick(15_000);
      fixture.detectChanges();

      expect(component.saving).toBeFalse();
      expect(component.savePending).toBeTrue();
      expect(notificationService.warning).toHaveBeenCalledOnceWith(
        'El guardado sigue esperando respuesta de Firebase. No vuelvas a enviarlo; puedes cerrar esta ventana mientras termina.',
      );
      expect(
        fixture.nativeElement.querySelector('.category-save-pending')
          ?.textContent,
      ).toContain('No lo envíes de nuevo');
      expect(
        fixture.nativeElement.textContent,
      ).toContain('Esperando respuesta...');

      await component.saveCategory();
      expect(categoryService.createCategory).toHaveBeenCalledTimes(1);

      component.closeModal();
      expect(component.modalOpen).toBeFalse();

      resolveCreated('created-slow');
      await savePromise;

      expect(component.categories).toContain(
        jasmine.objectContaining({
          id: 'created-slow',
          name: 'Nueva categoría',
        }),
      );
      expect(component.savePending).toBeFalse();
      expect(component.saving).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('deletes a category and clamps the current page when the last page disappears', async () => {
    const component = fixture.componentInstance;
    component.categories = Array.from({ length: 9 }, (_, index) => ({
      ...category,
      id: `category-${index + 1}`,
      name: `Category ${index + 1}`,
      sortOrder: index + 1,
    }));
    component.pageSize = 2;
    component.goToPage(5);
    const lastCategory = component.categories[8];
    component.requestDeletion(lastCategory);

    await component.confirmDeletion();

    expect(categoryService.deleteCategory).toHaveBeenCalledOnceWith(
      lastCategory.id,
    );
    expect(component.categories).toHaveSize(8);
    expect(
      component.categories.some(({ id }) => id === lastCategory.id),
    ).toBeFalse();
    expect(component.pendingDeletion).toBeNull();
    expect(component.currentPage).toBe(4);
    expect(component.deleting).toBeFalse();
    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Categoría eliminada correctamente.',
    );
  });

  it('preserves a category and its deletion confirmation when deletion fails', async () => {
    const component = fixture.componentInstance;
    component.categories = [category];
    component.requestDeletion(category);
    categoryService.deleteCategory.and.rejectWith(
      new Error('No fue posible eliminar la categoría.'),
    );

    await component.confirmDeletion();

    expect(component.categories).toEqual([category]);
    expect(component.pendingDeletion).toEqual(category);
    expect(component.deleting).toBeFalse();
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'No fue posible eliminar la categoría.',
    );
  });

  it('does not duplicate concurrent category loads', async () => {
    const component = fixture.componentInstance;
    let resolveRequest!: (categories: Category[]) => void;
    categoryService.getCategories.and.returnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const firstLoad = component.loadCategories();
    const secondLoad = component.loadCategories();

    expect(categoryService.getCategories).toHaveBeenCalledOnceWith('normal');
    resolveRequest([category]);
    await Promise.all([firstLoad, secondLoad]);

    expect(component.categories).toEqual([category]);
    expect(component.loading).toBeFalse();
  });

  it('handles 2000 in-memory categories with cached filtering and no extra reads', async () => {
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.categories = Array.from({ length: 2000 }, (_, index) => ({
      ...category,
      id: `category-${index}`,
      name: `Category ${index}`,
      status: index % 2 === 0 ? 'active' : 'inactive',
      sortOrder: 2000 - index,
    }));

    const startedAt = performance.now();
    component.onSearchChange('category 19');
    component.onStatusFilterChange('active');
    component.onSortChange('name');

    const results = component.filteredCategories;
    const elapsedMs = performance.now() - startedAt;

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        ({ name, status }) =>
          name.toLocaleLowerCase('es').includes('category 19') &&
          status === 'active',
      ),
    ).toBeTrue();
    expect(component.filteredCategories).toBe(results);
    expect(elapsedMs).toBeLessThan(2000);
    expect(categoryService.getCategories).toHaveBeenCalledOnceWith('normal');
  });

  it('renders only the current page and updates the results immediately from filter controls', async () => {
    const component = fixture.componentInstance;
    const categories: Category[] = Array.from({ length: 10 }, (_, index) => ({
      ...category,
      id: `category-${index}`,
      name: `Category ${index}`,
      status: index < 5 ? 'active' : 'inactive',
      sortOrder: index + 1,
    }));
    categoryService.getCategories.and.resolveTo(categories);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector(
      '.category-search-field input',
    ) as HTMLInputElement;
    searchInput.value = 'Category 1';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.filteredCategories.map(({ name }) => name)).toEqual([
      'Category 1',
    ]);
    expect(component.currentPage).toBe(1);

    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    const statusSelect = fixture.nativeElement.querySelector(
      'select[aria-label="Filtrar por estado"]',
    ) as HTMLSelectElement;
    statusSelect.value = 'inactive';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.filteredCategories).toHaveSize(5);
    expect(
      component.filteredCategories.every(({ status }) => status === 'inactive'),
    ).toBeTrue();
    expect(
      fixture.nativeElement.querySelectorAll('.category-table tbody tr'),
    ).toHaveSize(5);
    expect(categoryService.getCategories).toHaveBeenCalledOnceWith('normal');
  });
});
