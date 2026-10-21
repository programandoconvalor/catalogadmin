import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CatalogService } from '../../core/catalog/catalog.service';
import { CategoryService } from '../../core/catalog/category.service';
import type { CatalogItem } from '../../core/models/catalog-item.model';
import type { Category } from '../../core/models/category.model';
import { NotificationService } from '../../core/notifications/notification.service';
import { StorageService } from '../../core/storage/storage.service';
import { CatalogPageComponent } from './catalog-page.component';

describe('CatalogPageComponent product form', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CatalogPageComponent>>;
  let component: CatalogPageComponent;
  let catalogService: jasmine.SpyObj<CatalogService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let storageService: jasmine.SpyObj<StorageService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const existingItem: CatalogItem = {
    id: 'product-1',
    code: 'COM-1001',
    name: 'Bouquet de temporada',
    description: 'Descripción original del producto.',
    imageUrl: 'https://example.test/current.jpg',
    price: 580,
    categoryId: 'combinados',
    status: 'inactive',
    sortOrder: 3,
    commercialData: {
      id: 73,
      categoryId: 'combinados',
      baseTitle: 'Bouquet de temporada',
      subtitle: 'Subtítulo conservado',
      badgeLabel: 'Favorito',
      defaultVariantId: 'helio',
      basePriceMxn: 580,
      defaultImages: ['https://example.test/current.jpg'],
      activeSizeOptions: [
        {
          id: 'aire',
          priceMxn: 100,
          buttonLabel: 'Con aire',
          titleLabel: 'Aire',
          images: ['https://example.test/air.jpg'],
        },
      ],
      productSizes: [
        { id: 'std', label: 'Estándar', priceMxn: 750, subtitle: 'Actual' },
      ],
      colorDots: ['#f00'],
      badge: 'new',
      deliveryMessage: 'Entrega segura',
      description: 'Descripción original del producto.',
      includes: ['Moño'],
      deliveryZones: ['Metepec'],
      isAvailable: false,
      sku: 'CF-OLD',
      menuAssignments: [{ groupId: 'rosas', subcategory: 'temporada' }],
      ui: {
        showBadge: false,
        showDeliveryDate: true,
        showColorDots: true,
        showProductSizes: true,
      },
    },
  };

  beforeEach(async () => {
    catalogService = jasmine.createSpyObj<CatalogService>('CatalogService', [
      'getItems',
      'getItem',
      'createItem',
      'updateItem',
      'deleteItem',
    ]);
    categoryService = jasmine.createSpyObj<CategoryService>('CategoryService', [
      'getCategories',
      'createCategory',
      'updateCategory',
      'deleteCategory',
    ]);
    storageService = jasmine.createSpyObj<StorageService>('StorageService', [
      'uploadProductImage',
      'deleteProductImage',
      'deleteProductImageByPath',
    ]);
    notificationService = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['success', 'error', 'warning', 'info', 'dismiss'],
    );
    catalogService.getItems.and.resolveTo([]);
    categoryService.getCategories.and.resolveTo([]);
    catalogService.getItem.and.resolveTo(existingItem);
    catalogService.createItem.and.resolveTo('new-product');
    catalogService.updateItem.and.resolveTo();
    categoryService.createCategory.and.resolveTo('new-category');
    categoryService.updateCategory.and.resolveTo();
    categoryService.deleteCategory.and.resolveTo();
    catalogService.deleteItem.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [CatalogPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ catalogId: 'normal' }) } },
        { provide: CatalogService, useValue: catalogService },
        { provide: CategoryService, useValue: categoryService },
        { provide: StorageService, useValue: storageService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('opens the create form and starts with editable commercial lists', () => {
    component.openCreateItem();
    fixture.detectChanges();

    expect(component.itemModalOpen).toBeTrue();
    expect(fixture.nativeElement.querySelector('.catalog-product-form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#commercialDataJson')).toBeNull();
    expect(component.productSizes.length).toBe(0);
    expect(component.includes.length).toBe(0);
    expect(component.deliveryZones.length).toBe(0);
  });

  it('loads existing commercial values when editing', async () => {
    await component.openEditItem(existingItem);

    expect(component.itemModalOpen).toBeTrue();
    expect(component.itemForm.controls.sku.value).toBe('CF-OLD');
    expect(component.itemForm.controls.isAvailable.value).toBeFalse();
    expect(component.productSizes.at(0).controls.id.value).toBe('std');
    expect(component.includes.at(0).value).toBe('Moño');
    expect(component.deliveryZones.at(0).value).toBe('Metepec');
  });

  it('adds and removes sizes, includes and delivery zones', () => {
    component.openCreateItem();
    component.addProductSize();
    component.addProductSize();
    component.addInclude();
    component.addInclude();
    component.addDeliveryZone();
    component.addDeliveryZone();

    component.removeProductSize(0);
    component.removeInclude(0);
    component.removeDeliveryZone(0);

    expect(component.productSizes.length).toBe(1);
    expect(component.includes.length).toBe(1);
    expect(component.deliveryZones.length).toBe(1);
  });

  it('rejects missing required values and negative prices', async () => {
    component.openCreateItem();
    await component.saveItem();

    expect(component.itemForm.invalid).toBeTrue();
    expect(catalogService.createItem).not.toHaveBeenCalled();

    component.itemForm.patchValue({
      code: 'TEST-1',
      sku: 'TEST-1',
      name: 'Prueba',
      description: 'Descripción',
      price: -1,
    });
    await component.saveItem();

    expect(catalogService.createItem).not.toHaveBeenCalled();

    component.itemForm.controls.price.setValue(0);
    component.addProductSize();
    component.productSizes.at(0).setValue({
      id: 'standard',
      label: 'Estándar',
      priceMxn: -1,
      subtitle: '',
    });
    await component.saveItem();

    expect(catalogService.createItem).not.toHaveBeenCalled();
  });

  it('converts form prices and order to numbers when creating', async () => {
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'TEST-1',
      sku: 'SKU-1',
      name: 'Producto de prueba',
      description: 'Descripción',
      price: 120.5,
      sortOrder: 4,
    });
    component.addProductSize();
    component.productSizes.at(0).setValue({
      id: 'standard',
      label: 'Estándar',
      priceMxn: 240.5,
      subtitle: '',
    });
    component.addInclude();
    component.includes.at(0).setValue('Tarjeta');
    component.addInclude();
    component.addDeliveryZone();
    component.deliveryZones.at(0).setValue('Metepec');
    component.addDeliveryZone();
    component.deliveryZones.at(1).setValue(' metEpec ');
    component.addDeliveryZone();
    component.deliveryZones.at(2).setValue(' ');

    await component.saveItem();

    const savedItem = catalogService.createItem.calls.mostRecent().args[1];
    expect(savedItem.price).toBe(120.5);
    expect(savedItem.sortOrder).toBe(4);
    expect(savedItem.commercialData?.basePriceMxn).toBe(120.5);
    expect(savedItem.commercialData?.productSizes?.[0].priceMxn).toBe(240.5);
    expect(savedItem.commercialData?.includes).toEqual(['Tarjeta']);
    expect(savedItem.commercialData?.deliveryZones).toEqual(['Metepec']);
    expect(typeof savedItem.price).toBe('number');
    expect(typeof savedItem.sortOrder).toBe('number');
  });

  it('creates a product without requiring or uploading an image', async () => {
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'NO-IMAGE',
      sku: 'NO-IMAGE',
      name: 'Producto sin imagen',
      description: 'Sin imagen principal.',
    });

    await component.saveItem();

    expect(storageService.uploadProductImage).not.toHaveBeenCalled();
    expect(catalogService.createItem).toHaveBeenCalled();
    expect(catalogService.createItem.calls.mostRecent().args[1].imageUrl)
      .toBeUndefined();
    expect(component.savingItem).toBeFalse();
    expect(component.uploadingImage).toBeFalse();
    expect(component.successMessage).toBe('Producto creado correctamente.');
  });

  it('renders catalog results after the asynchronous load completes', async () => {
    catalogService.getItems.and.resolveTo([existingItem]);

    await component.loadData();

    const renderedText = fixture.nativeElement.textContent as string;
    expect(renderedText).toContain(existingItem.code);
    expect(renderedText).not.toContain('Cargando productos y categorías');
  });

  it('uploads an image before creating the product and stores its URL', async () => {
    const callOrder: string[] = [];
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'WITH-IMAGE',
      sku: 'WITH-IMAGE',
      name: 'Producto con imagen',
      description: 'Imagen guardada antes del documento.',
    });
    component.selectedImage = new File(['test image'], 'flower.png', {
      type: 'image/png',
    });
    storageService.uploadProductImage.and.callFake(
      async (_catalogId, _code, _file, onProgress) => {
        callOrder.push('storage');
        onProgress?.({
          bytesTransferred: 10,
          totalBytes: 10,
          percent: 100,
        });
        return {
          downloadUrl: 'https://example.test/flower.png',
          fullPath: 'tenants/test/catalogs/normal/products/images/flower.png',
        };
      },
    );
    catalogService.createItem.and.callFake(async () => {
      callOrder.push('firestore');
      return 'new-product';
    });

    await component.saveItem();

    expect(storageService.uploadProductImage).toHaveBeenCalled();
    expect(callOrder).toEqual(['storage', 'firestore']);
    const uploadedItem = catalogService.createItem.calls.mostRecent().args[1];
    expect(uploadedItem.imageUrl).toBe('https://example.test/flower.png');
    expect(uploadedItem.commercialData?.defaultImages).toEqual([
      'https://example.test/flower.png',
    ]);
    expect(component.uploadingImage).toBeFalse();
    expect(component.uploadProgress).toBe(0);
    expect(component.savePhase).toBe('idle');
  });

  it('shows Storage errors and resets upload state after a failed upload', async () => {
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'STORAGE-ERROR',
      sku: 'STORAGE-ERROR',
      name: 'Producto con error',
      description: 'La carga va a fallar.',
    });
    component.selectedImage = new File(['test image'], 'flower.png', {
      type: 'image/png',
    });
    storageService.uploadProductImage.and.rejectWith(
      Object.assign(new Error('User does not have permission'), {
        code: 'storage/unauthorized',
      }),
    );

    await component.saveItem();

    expect(catalogService.createItem).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('[storage/unauthorized]');
    expect(component.errorMessage).toContain('User does not have permission');
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'No tienes permisos para administrar la imagen del producto.',
    );
    expect(notificationService.success).not.toHaveBeenCalled();
    expect(component.savingItem).toBeFalse();
    expect(component.uploadingImage).toBeFalse();
    expect(component.savePhase).toBe('idle');
  });

  it('cleans up a newly uploaded image if Firestore rejects the document', async () => {
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'FIRESTORE-ERROR',
      sku: 'FIRESTORE-ERROR',
      name: 'Producto con error',
      description: 'La escritura va a fallar.',
    });
    component.selectedImage = new File(['test image'], 'flower.png', {
      type: 'image/png',
    });
    storageService.uploadProductImage.and.resolveTo({
      downloadUrl: 'https://example.test/new-image.png',
      fullPath: 'tenants/test/catalogs/normal/products/images/new-image.png',
    });
    storageService.deleteProductImageByPath.and.resolveTo();
    catalogService.createItem.and.rejectWith(
      Object.assign(new Error('Permission denied'), {
        code: 'permission-denied',
      }),
    );

    await component.saveItem();

    expect(storageService.deleteProductImageByPath).toHaveBeenCalledWith(
      'tenants/test/catalogs/normal/products/images/new-image.png',
    );
    expect(component.errorMessage).toContain('[permission-denied]');
    expect(component.savingItem).toBeFalse();
    expect(component.uploadingImage).toBeFalse();
    expect(component.savePhase).toBe('idle');
    expect(component.itemModalOpen).toBeTrue();
  });

  it('preserves existing commercial settings when editing', async () => {
    catalogService.getItems.and.resolveTo([existingItem]);
    await component.loadData();
    await component.openEditItem(existingItem);
    await component.saveItem();

    const savedItem = catalogService.updateItem.calls.mostRecent().args[2];
    expect(savedItem.commercialData?.id).toBe(73);
    expect(savedItem.commercialData?.activeSizeOptions).toEqual(
      existingItem.commercialData?.activeSizeOptions,
    );
    expect(savedItem.commercialData?.defaultVariantId).toBe('helio');
    expect(savedItem.commercialData?.subtitle).toBe('Subtítulo conservado');
    expect(savedItem.commercialData?.badgeLabel).toBe('Favorito');
    expect(savedItem.commercialData?.menuAssignments).toEqual(
      existingItem.commercialData?.menuAssignments,
    );
    expect(savedItem.commercialData?.ui).toEqual(existingItem.commercialData?.ui);
    expect(savedItem.commercialData?.sku).toBe('CF-OLD');
    expect(savedItem.status).toBe('inactive');
  });

  it('reports Firestore save errors and prevents duplicate submissions', async () => {
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'TEST-1',
      sku: 'TEST-1',
      name: 'Producto de prueba',
      description: 'Descripción',
    });
    catalogService.createItem.and.rejectWith(new Error('Firebase denied'));

    await component.saveItem();
    expect(component.errorMessage).toBe('Firebase denied');

    let finishSave!: (id: string) => void;
    catalogService.createItem.and.returnValue(
      new Promise<string>((resolve) => {
        finishSave = resolve;
      }),
    );
    const firstSave = component.saveItem();
    await component.saveItem();

    expect(catalogService.createItem).toHaveBeenCalledTimes(2);
    finishSave('created');
    await firstSave;
    expect(notificationService.success).toHaveBeenCalledTimes(1);
  });

  it('shows a success toast after creating a product', async () => {
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'TOAST-CREATE',
      sku: 'TOAST-CREATE',
      name: 'Ramo nuevo',
      description: 'Producto para probar la notificación.',
    });

    await component.saveItem();

    expect(notificationService.success).toHaveBeenCalledOnceWith(
      '¡Producto guardado correctamente!',
    );
    expect(notificationService.error).not.toHaveBeenCalled();
  });

  it('shows a success toast after updating a product', async () => {
    component.editingItemId = existingItem.id;
    component.itemForm.patchValue({
      code: existingItem.code,
      sku: 'SKU-EDITED',
      name: 'Ramo actualizado',
      description: 'Cambios para probar la notificación.',
    });

    await component.saveItem();

    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Los cambios del producto se guardaron correctamente.',
    );
  });

  it('shows a success toast after deleting a product', async () => {
    component.items = [existingItem];
    component.requestItemDeletion(existingItem);

    await component.confirmDeletion();

    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Producto eliminado correctamente.',
    );
  });

  it('shows success toasts after creating and updating categories', async () => {
    component.openCreateCategory();
    component.categoryForm.controls.name.setValue('Primavera');
    await component.saveCategory();
    expect(notificationService.success).toHaveBeenCalledWith(
      '¡Categoría creada correctamente!',
    );

    notificationService.success.calls.reset();
    const category: Category = {
      id: 'category-1',
      catalogId: 'normal',
      name: 'Primavera',
      status: 'active',
      sortOrder: 0,
    };
    component.openEditCategory(category);
    component.categoryForm.controls.name.setValue('Temporada');
    await component.saveCategory();
    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Categoría actualizada correctamente.',
    );
  });

  it('shows a success toast after deleting a category', async () => {
    component.requestCategoryDeletion({
      id: 'category-1',
      catalogId: 'normal',
      name: 'Primavera',
      status: 'active',
      sortOrder: 0,
    });

    await component.confirmDeletion();

    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Categoría eliminada correctamente.',
    );
  });

  it('shows an error toast when a category save fails', async () => {
    component.openCreateCategory();
    component.categoryForm.controls.name.setValue('Primavera');
    categoryService.createCategory.and.rejectWith(
      Object.assign(new Error('Private backend details'), {
        code: 'unavailable',
      }),
    );

    await component.saveCategory();

    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'El servicio no está disponible temporalmente. Inténtalo de nuevo.',
    );
    expect(notificationService.success).not.toHaveBeenCalled();
  });

  it('shows an error toast when a product deletion fails', async () => {
    component.requestItemDeletion(existingItem);
    catalogService.deleteItem.and.rejectWith(new Error('Private backend details'));

    await component.confirmDeletion();

    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'No fue posible eliminar el producto.',
    );
    expect(notificationService.success).not.toHaveBeenCalled();
  });

  it('shows only the selected product view and switches without reloading data', async () => {
    await fixture.whenStable();
    catalogService.getItems.and.resolveTo([existingItem]);
    await component.loadData();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(component.viewMode).toBe('cards');
    expect(root.querySelector('.catalog-product-grid')).not.toBeNull();
    expect(root.querySelector('.catalog-product-list')).toBeNull();
    expect(catalogService.getItems).toHaveBeenCalledTimes(2);

    const listButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.trim() === 'Lista') as HTMLButtonElement;
    listButton.click();
    fixture.detectChanges();

    expect(component.viewMode).toBe('list');
    expect(root.querySelector('.catalog-product-grid')).toBeNull();
    expect(root.querySelector('.catalog-product-list')).not.toBeNull();
    expect(
      root.querySelectorAll('.catalog-product-list tbody button').length,
    ).toBe(2);
    expect(
      root.querySelector('[aria-pressed="true"]')?.textContent,
    ).toContain('Lista');
    expect(root.querySelector('[aria-pressed="true"]')?.classList)
      .toContain('bg-pink-600');
    expect(catalogService.getItems).toHaveBeenCalledTimes(2);

    const cardsButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.trim() === 'Tarjetas') as HTMLButtonElement;
    cardsButton.click();
    fixture.detectChanges();

    expect(root.querySelector('.catalog-product-grid')).not.toBeNull();
    expect(root.querySelector('.catalog-product-list')).toBeNull();
    expect(root.querySelector('[aria-pressed="true"]')?.textContent)
      .toContain('Tarjetas');
    expect(root.querySelector('[aria-pressed="true"]')?.classList)
      .toContain('bg-pink-600');
    expect(catalogService.getItems).toHaveBeenCalledTimes(2);
    expect(
      root.querySelectorAll('.catalog-product-grid article button').length,
    ).toBe(2);
    expect(catalogService.createItem).not.toHaveBeenCalled();
    expect(catalogService.updateItem).not.toHaveBeenCalled();
    expect(catalogService.deleteItem).not.toHaveBeenCalled();
  });

  it('applies search, category, status and sorting to the shared product collection', () => {
    const root = fixture.nativeElement as HTMLElement;
    component.loading = false;
    const secondItem: CatalogItem = {
      ...existingItem,
      id: 'product-2',
      code: 'ROS-2001',
      name: 'Rosas de jardín',
      description: 'Rosas frescas',
      categoryId: 'rosas',
      status: 'active',
      price: 720,
      sortOrder: 1,
    };
    component.items = [existingItem, secondItem];
    component.categories = [
      {
        id: 'combinados',
        catalogId: 'normal',
        name: 'Combinados',
        status: 'active',
        sortOrder: 0,
      },
      {
        id: 'rosas',
        catalogId: 'normal',
        name: 'Rosas',
        status: 'active',
        sortOrder: 1,
      },
    ];
    fixture.detectChanges();

    const search = root.querySelector(
      '#catalog-search',
    ) as HTMLInputElement;
    search.value = 'rosas';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.filteredItems.map((item) => item.id)).toEqual(['product-2']);

    const categorySelect = root.querySelector(
      '[aria-label="Filtrar por categoría"]',
    ) as HTMLSelectElement;
    categorySelect.value = 'combinados';
    categorySelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.filteredItems).toEqual([]);

    search.value = '';
    search.dispatchEvent(new Event('input'));
    categorySelect.value = 'rosas';
    categorySelect.dispatchEvent(new Event('change'));
    const statusSelect = root.querySelector(
      '[aria-label="Filtrar por estado"]',
    ) as HTMLSelectElement;
    statusSelect.value = 'active';
    statusSelect.dispatchEvent(new Event('change'));
    const sortSelect = root.querySelector(
      '[aria-label="Ordenar productos"]',
    ) as HTMLSelectElement;
    sortSelect.value = 'price';
    sortSelect.dispatchEvent(new Event('change'));
    component.sortDirection = 'desc';
    fixture.detectChanges();

    expect(component.filteredItems.map((item) => item.id)).toEqual(['product-2']);
    expect(root.querySelectorAll('.catalog-product-grid article').length)
      .toBe(1);
  });

  it('shows a safe error toast without exposing Firebase internals or success', async () => {
    component.openCreateItem();
    component.itemForm.patchValue({
      code: 'TOAST-ERROR',
      sku: 'TOAST-ERROR',
      name: 'Producto con error',
      description: 'La operación fallará.',
    });
    catalogService.createItem.and.rejectWith(
      Object.assign(new Error('Private backend details'), {
        code: 'permission-denied',
      }),
    );

    await component.saveItem();

    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'No tienes permisos para realizar esta operación.',
    );
    expect(notificationService.success).not.toHaveBeenCalled();
  });
});
