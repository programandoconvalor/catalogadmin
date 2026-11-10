import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogService } from '../../core/catalog/catalog.service';
import { CategoryService } from '../../core/catalog/category.service';
import { DeliveryZoneService } from '../../core/catalog/delivery-zone.service';
import { CatalogItem, CatalogProductCommercialData } from '../../core/models/catalog-item.model';
import { NotificationService } from '../../core/notifications/notification.service';
import { StorageService } from '../../core/storage/storage.service';
import { ProductsComponent } from './products.component';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let catalogService: jasmine.SpyObj<CatalogService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    catalogService = jasmine.createSpyObj<CatalogService>(
      'CatalogService',
      ['getItems', 'getItem', 'createItem', 'updateItem', 'deleteItem'],
    );
    const categoryService = jasmine.createSpyObj<CategoryService>(
      'CategoryService',
      ['getCategories'],
    );
    const deliveryZoneService = jasmine.createSpyObj<DeliveryZoneService>(
      'DeliveryZoneService',
      ['getDeliveryZones'],
    );
    notificationService = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['success', 'error'],
    );
    const storageService = jasmine.createSpyObj<StorageService>(
      'StorageService',
      ['uploadProductImage', 'deleteProductImage', 'deleteProductImageByPath'],
    );
    catalogService.getItems.and.resolveTo([]);
    catalogService.getItem.and.resolveTo(null);
    catalogService.createItem.and.resolveTo('created-product');
    catalogService.updateItem.and.resolveTo();
    catalogService.deleteItem.and.resolveTo();
    categoryService.getCategories.and.resolveTo([]);
    deliveryZoneService.getDeliveryZones.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [
        { provide: CatalogService, useValue: catalogService },
        { provide: CategoryService, useValue: categoryService },
        { provide: DeliveryZoneService, useValue: deliveryZoneService },
        { provide: NotificationService, useValue: notificationService },
        { provide: StorageService, useValue: storageService },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the categories-style product filters without price or action buttons', () => {
    const root = fixture.nativeElement as HTMLElement;
    const toolbar = root.querySelector<HTMLElement>(
      '.products-toolbar',
    );
    const sortSelect = toolbar?.querySelector<HTMLSelectElement>(
      '[aria-label="Ordenar productos"]',
    );

    expect(toolbar).toBeTruthy();
    expect(sortSelect).toBeTruthy();
    expect(Array.from(sortSelect?.options ?? []).map((option) => option.textContent?.trim()))
      .toEqual(['Orden personalizado', 'Nombre', 'Código']);
    expect(toolbar?.querySelector('[aria-label="Precio mínimo"]')).toBeNull();
    expect(toolbar?.querySelector('[aria-label="Precio máximo"]')).toBeNull();
    expect(toolbar?.querySelector('.catalog-filter-button')).toBeNull();
    expect(toolbar?.querySelector('.catalog-clear-button')).toBeNull();
  });

  it('shows an icon and create action when the catalog has no products', async () => {
    await fixture.whenStable();
    component.items = [];
    component.loading = false;
    component.errorMessage = null;
    component.searchTerm = '';
    component.categoryFilter = '';
    component.statusFilter = '';
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector(
      '.products-empty-state',
    ) as HTMLElement;
    const createButton = emptyState.querySelector(
      '.products-empty-action',
    ) as HTMLButtonElement;

    expect(emptyState.querySelector('svg')).toBeTruthy();
    expect(emptyState.textContent).toContain('Todavía no hay productos');
    expect(createButton.textContent).toContain('Agregar primer producto');

    createButton.click();
    fixture.detectChanges();
    expect(component.itemModalOpen).toBeTrue();
  });

  it('uses the categories-style catalog heading in the product form', () => {
    component.openCreateItem();
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector(
      '.catalog-form-header',
    ) as HTMLElement;

    expect(header.querySelector('.catalog-form-eyebrow')?.textContent?.trim())
      .toBe('CATÁLOGO');
    expect(header.querySelector('h2')?.textContent?.trim()).toBe('Crear producto');
    expect(header.textContent).toContain(
      'Completa los datos para agregar un producto.',
    );
  });

  it('requires a category and at least one product image before creating', async () => {
    component.openCreateItem();
    expect(component.itemForm.controls.categoryId.hasError('required')).toBeTrue();
    component.itemForm.controls.categoryId.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'La categoría es obligatoria.',
    );

    component.itemForm.controls.sku.setValue('QA-REQUIRED-FIELDS');
    component.itemForm.controls.name.setValue('Test bouquet');
    component.itemForm.controls.description.setValue('A test flower arrangement.');
    component.itemForm.controls.categoryId.setValue('category-1');

    expect(component.itemForm.controls.categoryId.valid).toBeTrue();
    expect(component.hasProductImage).toBeFalse();

    await component.saveItem();

    expect(catalogService.createItem).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Agrega al menos una imagen del producto.',
    );
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'Agrega al menos una imagen del producto.',
    );
    expect(component.imageError).toBe(
      'Agrega al menos una imagen del producto.',
    );
  });

  it('allows creating a product without a description', async () => {
    component.openCreateItem();
    component.itemForm.controls.sku.setValue('QA-OPTIONAL-DESCRIPTION');
    component.itemForm.controls.name.setValue('Test bouquet');
    component.itemForm.controls.categoryId.setValue('category-1');
    component.itemForm.controls.price.setValue(350);
    component.existingImageUrls = ['https://example.test/qa-product.jpg'];
    fixture.detectChanges();

    expect(component.itemForm.controls.description.valid).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain(
      'La descripción es obligatoria.',
    );

    await component.saveItem();

    expect(catalogService.createItem).toHaveBeenCalledWith(
      'normal',
      jasmine.objectContaining({ description: '' }),
    );
  });

  it('suggests the next order after the last product and rejects duplicates', () => {
    component.items = Array.from({ length: 5 }, (_, index) =>
      makeProduct(`product-${index + 1}`, index + 1),
    );
    component.openCreateItem();

    const sortOrder = component.itemForm.controls.sortOrder;
    expect(sortOrder.value).toBe(6);

    sortOrder.setValue(3);
    component.onSortOrderInput();
    fixture.detectChanges();

    expect(sortOrder.hasError('duplicateOrder')).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'Este orden ya está asignado a otro producto.',
    );
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'El orden 3 ya está asignado a otro producto.',
    );
  });

  it('saves trimmed include values and the suggested order when creating a product', async () => {
    component.items = Array.from({ length: 5 }, (_, index) =>
      makeProduct(`product-${index + 1}`, index + 1),
    );
    component.openCreateItem();
    component.itemForm.controls.sku.setValue('QA-NEW-PRODUCT');
    component.itemForm.controls.name.setValue('Test bouquet');
    component.itemForm.controls.description.setValue('A test flower arrangement.');
    component.itemForm.controls.price.setValue(350);
    component.itemForm.controls.categoryId.setValue('category-1');
    component.existingImageUrls = ['https://example.test/qa-product.jpg'];
    component.addInclude();
    component.includes.at(0).setValue('  Greeting card  ');

    await component.saveItem();

    expect(catalogService.createItem).toHaveBeenCalledWith(
      'normal',
      jasmine.objectContaining({
        sortOrder: 6,
        commercialData: jasmine.objectContaining({
          includes: ['Greeting card'],
        }),
      }),
    );
  });

  it('loads included values into their controls and saves edited values', async () => {
    const product = makeProduct('product-1', 1, {
      ...makeCommercialData(),
      includes: ['Tarjeta floral', 'Jarrón de vidrio', 'Moño satinado'],
    });
    component.items = [product];
    catalogService.getItem.and.resolveTo(product);

    await component.openEditItem(product);
    fixture.detectChanges();

    expect(component.includes.controls.map((control) => control.value)).toEqual([
      'Tarjeta floral',
      'Jarrón de vidrio',
      'Moño satinado',
    ]);
    expect(
      (fixture.nativeElement.querySelector(
        '[aria-label="Elemento incluido 1"]',
      ) as HTMLInputElement).value,
    ).toBe('Tarjeta floral');

    const includeInput = fixture.nativeElement.querySelector(
      '[aria-label="Elemento incluido 1"]',
    ) as HTMLInputElement;
    includeInput.value = 'Tarjeta personalizada';
    includeInput.dispatchEvent(new Event('input', { bubbles: true }));
    component.itemForm.controls.description.setValue('');
    fixture.detectChanges();
    await component.saveItem();

    expect(catalogService.updateItem).toHaveBeenCalledWith(
      'normal',
      product.id,
      jasmine.objectContaining({
        description: '',
        commercialData: jasmine.objectContaining({
          includes: [
            'Tarjeta personalizada',
            'Jarrón de vidrio',
            'Moño satinado',
          ],
        }),
      }),
    );
  });

  it('round-trips include values for three products through create, edit, and reload', async () => {
    const persistedProducts = new Map<string, CatalogItem>();
    const includeLists = [
      ['Tarjeta'],
      ['Tarjeta', 'Moño'],
      ['Tarjeta', 'Moño', 'Jarrón'],
    ];

    catalogService.createItem.and.callFake(async (_catalogId, input) => {
      const id = `includes-round-trip-${persistedProducts.size + 1}`;
      persistedProducts.set(id, { ...input, id });
      return id;
    });
    catalogService.getItem.and.callFake(
      async (_catalogId, id) => persistedProducts.get(id) ?? null,
    );
    catalogService.updateItem.and.callFake(async (_catalogId, id, updates) => {
      const existing = persistedProducts.get(id);
      if (!existing) {
        throw new Error(`Test product ${id} was not created.`);
      }

      persistedProducts.set(id, {
        ...existing,
        ...updates,
        commercialData: updates.commercialData
          ? { ...existing.commercialData, ...updates.commercialData }
          : existing.commercialData,
      });
    });

    for (const [productIndex, includes] of includeLists.entries()) {
      component.openCreateItem();
      fixture.detectChanges();
      component.itemForm.controls.name.setValue(`Includes test ${productIndex + 1}`);
      component.itemForm.controls.sku.setValue(`QA-INCLUDES-${productIndex + 1}`);
      component.itemForm.controls.categoryId.setValue('category-1');
      component.itemForm.controls.price.setValue(350);
      component.existingImageUrls = [
        `https://example.test/qa-includes-${productIndex + 1}.jpg`,
      ];

      for (const [includeIndex, include] of includes.entries()) {
        component.addInclude();
        component.includes.at(includeIndex).setValue(include);
      }

      await component.saveItem();
      fixture.detectChanges();

      const createdProduct = component.items.at(-1);
      expect(createdProduct?.commercialData?.includes).toEqual(includes);
      expect(createdProduct).toBeTruthy();

      await component.openEditItem(createdProduct!);
      fixture.detectChanges();
      expect(component.includes.controls.map((control) => control.value))
        .toEqual(includes);

      const editedIncludes = includes.map((include) => `${include} actualizado`);
      editedIncludes.forEach((include, index) =>
        component.includes.at(index).setValue(include),
      );
      fixture.detectChanges();
      await component.saveItem();
      fixture.detectChanges();

      const updatedProduct = component.items.find(
        (item) => item.id === createdProduct?.id,
      );
      expect(updatedProduct?.commercialData?.includes).toEqual(editedIncludes);

      await component.openEditItem(updatedProduct!);
      fixture.detectChanges();
      expect(component.includes.controls.map((control) => control.value))
        .toEqual(editedIncludes);
    }

    expect(catalogService.createItem).toHaveBeenCalledTimes(3);
    expect(catalogService.updateItem).toHaveBeenCalledTimes(3);
  });
});

function makeProduct(
  id: string,
  sortOrder: number,
  commercialData?: CatalogProductCommercialData,
): CatalogItem {
  return {
    id,
    code: `SKU-${id}`,
    name: `Product ${id}`,
    description: 'A test flower arrangement.',
    imageUrl: 'https://example.test/product.jpg',
    price: 250,
    categoryId: 'category-1',
    status: 'active',
    sortOrder,
    commercialData,
  };
}

function makeCommercialData(): CatalogProductCommercialData {
  return {
    id: 1,
    categoryId: '',
    baseTitle: 'Product',
    basePriceMxn: 250,
    defaultImages: [],
    activeSizeOptions: [],
    productSizes: [],
    colorDots: [],
    badge: null,
    deliveryZones: [],
    includes: [],
    isAvailable: true,
    sku: 'SKU-PRODUCT',
    menuAssignments: [],
    ui: {
      showBadge: true,
      showDeliveryDate: true,
      showColorDots: false,
    },
  };
}
