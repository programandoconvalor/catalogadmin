
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  NgZone,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CatalogService } from '../../core/catalog/catalog.service';
import { CategoryService } from '../../core/catalog/category.service';
import { DeliveryZoneService } from '../../core/catalog/delivery-zone.service';
import {
  getProductImageValidationError,
  StorageService,
  UploadedProductImage,
} from '../../core/storage/storage.service';
import {
  CatalogId,
  CatalogItem,
  CatalogItemInput,
  CatalogItemStatus,
  CatalogProductCommercialData,
  CatalogProductSize,
} from '../../core/models/catalog-item.model';
import {
  Category,
  CategoryInput,
  CategoryStatus,
} from '../../core/models/category.model';
import { NotificationService } from '../../core/notifications/notification.service';
import { DeliveryZone, DeliveryZoneInput, DeliveryZoneStatus } from '../../core/models/delivery-zone.model';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

type PendingDeletion =
  | { kind: 'item'; id: string; label: string }
  | { kind: 'category'; id: string; label: string }
  | { kind: 'deliveryZone'; id: string; label: string };

interface ProductSizeControls {
  id: FormControl<string>;
  label: FormControl<string>;
  priceMxn: FormControl<number>;
  subtitle: FormControl<string>;
}

type ProductSizeFormGroup = FormGroup<ProductSizeControls>;

@Component({
  selector: 'app-catalog-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageBreadcrumbComponent,
    ModalComponent,
  ],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly catalogService = inject(CatalogService);
  private readonly categoryService = inject(CategoryService);
  private readonly deliveryZoneService = inject(DeliveryZoneService);
  private readonly storageService = inject(StorageService);
  private readonly notificationService = inject(NotificationService);

  readonly itemForm = this.formBuilder.group({
    code: ['', [Validators.required, Validators.pattern(/\S/)]],
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(3000),
      ],
    ],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: [''],
    status: ['active' as CatalogItemStatus, Validators.required],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    sku: ['', [Validators.required, Validators.pattern(/\S/)]],
    isAvailable: [true],
    productSizes: this.formBuilder.array<ProductSizeFormGroup>([]),
    includes: this.formBuilder.array<FormControl<string>>([]),
  });

  readonly categoryForm = this.formBuilder.group({
    name: ['', Validators.required],
    status: ['active' as CategoryStatus, Validators.required],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
  });

  readonly deliveryZoneForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(300)],
    status: ['active' as DeliveryZoneStatus, Validators.required],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
  });

  catalogId: CatalogId = 'normal';
  pageTitle = 'Catálogo Normal';
  items: CatalogItem[] = [];
  categories: Category[] = [];
  deliveryZones: DeliveryZone[] = [];
  viewMode: 'cards' | 'list' = 'cards';
  searchTerm = '';
  categoryFilter = '';
  statusFilter: CatalogItemStatus | '' = '';
  sortBy: 'order' | 'name' | 'code' | 'price' = 'order';
  sortDirection: 'asc' | 'desc' = 'asc';
  loading = true;
  savingItem = false;
  uploadingImage = false;
  uploadProgress = 0;
  savePhase: 'idle' | 'uploadingImage' | 'writingDocument' = 'idle';
  savingCategory = false;
  savingDeliveryZone = false;
  deleting = false;
  itemModalOpen = false;
  categoryModalOpen = false;
  deliveryZoneModalOpen = false;
  editingItemId: string | null = null;
  editingCategoryId: string | null = null;
  editingDeliveryZoneId: string | null = null;
  pendingDeletion: PendingDeletion | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  imageError: string | null = null;
  currentImageUrl: string | undefined;
  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  private editingCommercialData?: CatalogProductCommercialData;
  private lastLoggedUploadProgress = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.releaseImagePreview());
  }

  private runInAngular(action: () => void): void {
    this.ngZone.run(() => {
      action();
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnInit(): void {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const catalogId = data['catalogId'];

        if (catalogId !== 'normal' && catalogId !== 'vip') {
          this.errorMessage = 'La ruta no especifica un catálogo válido.';
          this.loading = false;
          return;
        }

        this.catalogId = catalogId;
        this.pageTitle =
          catalogId === 'vip' ? 'Catálogo VIP' : 'Catálogo Normal';

        void this.loadData();
      });
  }

  get filteredItems(): CatalogItem[] {
    const search = this.searchTerm.trim().toLocaleLowerCase();

    return this.items
      .filter((item) => {
        const matchesSearch =
          !search ||
          `${item.code} ${item.name} ${item.description}`
            .toLocaleLowerCase()
            .includes(search);
        const matchesCategory =
          !this.categoryFilter || item.categoryId === this.categoryFilter;
        const matchesStatus =
          !this.statusFilter || item.status === this.statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((first, second) => {
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        const comparison =
          this.sortBy === 'name'
            ? first.name.localeCompare(second.name, 'es')
            : this.sortBy === 'code'
              ? first.code.localeCompare(second.code, 'es')
              : this.sortBy === 'price'
                ? first.price - second.price
                : first.sortOrder - second.sortOrder;

        return comparison * direction;
      });
  }

  get activeCategories(): Category[] {
    return this.categories.filter(
      (category) => category.status === 'active',
    );
  }

  get productSizes(): FormArray<ProductSizeFormGroup> {
    return this.itemForm.controls.productSizes;
  }

  get includes(): FormArray<FormControl<string>> {
    return this.itemForm.controls.includes;
  }


  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  onCategoryFilterChange(event: Event): void {
    this.categoryFilter = (event.target as HTMLSelectElement).value;
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter = (event.target as HTMLSelectElement)
      .value as CatalogItemStatus | '';
  }

  onSortChange(event: Event): void {
    this.sortBy = (event.target as HTMLSelectElement).value as
      | 'order'
      | 'name'
      | 'code'
      | 'price';
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;

    console.log('[CatalogPage] Iniciando carga:', {
      catalogId: this.catalogId,
    });

    try {
      const itemsPromise = this.catalogService
        .getItems(this.catalogId)
        .then((items) => {
          console.log('[CatalogPage] Productos cargados:', items.length);
          return items;
        })
        .catch((error: unknown) => {
          console.error(
            '[CatalogPage] Error al consultar productos:',
            error,
          );
          throw error;
        });

      const categoriesPromise = this.categoryService
        .getCategories(this.catalogId)
        .then((categories) => {
          console.log('[CatalogPage] Categorías cargadas:', categories.length);
          return categories;
        })
        .catch((error: unknown) => {
          console.error(
            '[CatalogPage] Error al consultar categorías:',
            error,
          );
          throw error;
        });

      const deliveryZonesPromise = this.deliveryZoneService.getDeliveryZones(this.catalogId)
        .then((zones) => {
          console.log('[CatalogPage] Zonas de entrega cargadas:', zones.length);
          return zones;
        })
        .catch((error: unknown) => {
          console.error('[CatalogPage] Error al consultar zonas de entrega:', error);
          throw error;
        });

      const [items, categories, deliveryZones] = await Promise.all([
        itemsPromise,
        categoriesPromise,
        deliveryZonesPromise,
      ]);

      this.runInAngular(() => {
        this.items = items;
        this.categories = categories;
        this.deliveryZones = deliveryZones;
        this.loading = false;
      });

      console.log('[CatalogPage] Carga completada correctamente.');
    } catch (error: unknown) {
      console.error(
        '[CatalogPage] No fue posible cargar el catálogo:',
        error,
      );

      this.runInAngular(() => {
        this.errorMessage = this.getErrorMessage(
          error,
          'No fue posible cargar los productos, categorías y zonas de entrega.',
        );
      });
    } finally {
      this.runInAngular(() => {
        this.loading = false;
      });
    }
  }

  openCreateItem(): void {
    this.clearFeedback();
    this.editingItemId = null;
    this.editingCommercialData = undefined;

    this.itemForm.reset({
      code: this.generateProductCode(),
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      status: 'active',
      sortOrder: 0,
      sku: '',
      isAvailable: true,
    });
    this.clearCommercialControls();

    this.currentImageUrl = undefined;
    this.clearSelectedImage();
    this.imageError = null;
    this.itemModalOpen = true;
  }

  async openEditItem(item: CatalogItem): Promise<void> {
    this.clearFeedback();

    try {
      const currentItem = await this.catalogService.getItem(
        this.catalogId,
        item.id,
      );

      if (!currentItem) {
        this.errorMessage =
          'El producto ya no existe. Actualiza la lista.';
        return;
      }

      this.runInAngular(() => {
        this.editingItemId = currentItem.id;
        this.editingCommercialData = currentItem.commercialData;
        this.currentImageUrl = currentItem.imageUrl;
        this.clearSelectedImage();
        this.imageError = null;

        this.itemForm.reset({
          code: currentItem.code,
          name: currentItem.name,
          description: currentItem.description,
          price: currentItem.price,
          categoryId: currentItem.categoryId ?? '',
          status: currentItem.status,
          sortOrder: currentItem.sortOrder,
          sku: currentItem.commercialData?.sku ?? currentItem.code,
          isAvailable: currentItem.commercialData?.isAvailable ?? true,
        });
        this.setCommercialControls(currentItem.commercialData);

        this.itemModalOpen = true;
      });
    } catch (error) {
      console.error(
        '[CatalogPage] No fue posible cargar el producto:',
        error,
      );

      this.runInAngular(() => {
        this.errorMessage = this.getErrorMessage(
          error,
          'No fue posible cargar el producto para editarlo.',
        );
      });
    }
  }

  async saveItem(): Promise<void> {
    if (this.itemForm.invalid || this.savingItem) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const value = this.itemForm.getRawValue();

    const productSizes = this.productSizes.getRawValue()
      .filter((size) => size.id.trim() || size.label.trim())
      .map((size) => ({
        id: size.id.trim(),
        label: size.label.trim(),
        priceMxn: Number(size.priceMxn),
        subtitle: size.subtitle.trim(),
      }));
    const includes = this.includes.getRawValue()
      .map((item) => item.trim())
      .filter(Boolean);
    const basePriceMxn = Number(value.price);
    const sortOrder = Number(value.sortOrder);
    const invalidSizePrice = productSizes.some(
      (size) => !Number.isFinite(size.priceMxn) || size.priceMxn < 0,
    );
    if (
      !Number.isFinite(basePriceMxn) ||
      basePriceMxn < 0 ||
      !Number.isFinite(sortOrder) ||
      sortOrder < 0 ||
      invalidSizePrice
    ) {
      this.errorMessage =
        'Revisa los precios y el orden: deben ser números válidos e iguales o mayores a 0.';
      return;
    }

    const item: CatalogItemInput = {
      code: value.code.trim() || this.generateProductCode(),
      name: value.name.trim(),
      description: value.description.trim(),
      price: basePriceMxn,
      categoryId: value.categoryId || undefined,
      status: value.status,
      sortOrder,
      commercialData: this.buildCommercialData({
        sku: value.sku.trim(),
        categoryId: value.categoryId,
        baseTitle: value.name.trim(),
        basePriceMxn,
        description: value.description.trim(),
        productSizes,
        includes,
        isAvailable: value.isAvailable,
      }),
    };

    this.savingItem = true;
    this.clearFeedback();
    this.imageError = null;

    let uploadedImage: UploadedProductImage | null = null;
    const previousImageUrl = this.currentImageUrl;
    const updatingItem = this.editingItemId !== null;

    try {
      if (this.selectedImage) {
        this.uploadingImage = true;
        this.savePhase = 'uploadingImage';
        this.uploadProgress = 0;
        this.lastLoggedUploadProgress = 0;
        console.info('[CatalogPage] Inicia carga de imagen:', {
          catalogId: this.catalogId,
          sizeBytes: this.selectedImage.size,
          contentType: this.selectedImage.type,
        });

        try {
          uploadedImage = await this.storageService.uploadProductImage(
            this.catalogId,
            item.code,
            this.selectedImage,
            (progress) => {
              this.runInAngular(() => {
                this.uploadProgress = progress.percent;
                if (
                  progress.percent === 100 ||
                  progress.percent - this.lastLoggedUploadProgress >= 25
                ) {
                  this.lastLoggedUploadProgress = progress.percent;
                  console.info('[CatalogPage] Progreso de imagen:', {
                    percent: progress.percent,
                    bytesTransferred: progress.bytesTransferred,
                    totalBytes: progress.totalBytes,
                  });
                }
              });
            },
          );
          console.info('[CatalogPage] Imagen lista para guardar:', {
            catalogId: this.catalogId,
            path: uploadedImage.fullPath,
          });
        } finally {
          this.runInAngular(() => {
            this.uploadingImage = false;
          });
        }
      } else {
        console.info(
          '[CatalogPage] Se guarda el producto sin imagen nueva.',
        );
      }

      this.runInAngular(() => {
        this.savePhase = 'writingDocument';
      });
      const itemToSave: CatalogItemInput = {
        ...item,
        ...(uploadedImage
          ? { imageUrl: uploadedImage.downloadUrl }
          : previousImageUrl
            ? { imageUrl: previousImageUrl }
            : {}),
      };
      if (uploadedImage && itemToSave.commercialData) {
        itemToSave.commercialData = {
          ...itemToSave.commercialData,
          defaultImages: [
            uploadedImage.downloadUrl,
            ...itemToSave.commercialData.defaultImages.filter(
            (imageUrl) =>
              imageUrl !== uploadedImage?.downloadUrl &&
              imageUrl !== previousImageUrl,
            ),
          ],
        };
      }

      if (this.editingItemId) {
        const itemId = this.editingItemId;
        console.info('[CatalogPage] Escribiendo cambios en Firestore:', {
          catalogId: this.catalogId,
          documentId: itemId,
        });

        try {
          await this.catalogService.updateItem(
            this.catalogId,
            itemId,
            itemToSave,
          );
        } catch (firestoreError) {
          await this.cleanupFailedUpload(uploadedImage, firestoreError);
          throw firestoreError;
        }

        this.runInAngular(() => {
          this.items = this.items
            .map((existing) =>
              existing.id === itemId
                ? { ...existing, ...itemToSave }
                : existing,
            )
            .sort((first, second) => first.sortOrder - second.sortOrder);

          this.successMessage = 'Producto actualizado correctamente.';
        });
      } else {
        let itemId: string;
        console.info('[CatalogPage] Creando producto en Firestore:', {
          catalogId: this.catalogId,
        });

        try {
          itemId = await this.catalogService.createItem(
            this.catalogId,
            itemToSave,
          );
        } catch (firestoreError) {
          await this.cleanupFailedUpload(uploadedImage, firestoreError);
          throw firestoreError;
        }

        this.runInAngular(() => {
          this.items = [
            ...this.items,
            { id: itemId, ...itemToSave },
          ].sort((first, second) => first.sortOrder - second.sortOrder);

          this.successMessage = 'Producto creado correctamente.';
        });
        console.info('[CatalogPage] Producto creado en Firestore:', {
          catalogId: this.catalogId,
          documentId: itemId,
        });
      }

      if (uploadedImage && previousImageUrl) {
        try {
          await this.storageService.deleteProductImage(previousImageUrl);
        } catch (cleanupError) {
          console.error(
            '[CatalogPage] Producto guardado, pero no se pudo eliminar la imagen anterior:',
            cleanupError,
          );

          this.runInAngular(() => {
            this.successMessage +=
              ' No fue posible eliminar la imagen anterior; se conserva para evitar perder datos.';
          });
        }
      }

      this.notificationService.success(
        updatingItem
          ? 'Los cambios del producto se guardaron correctamente.'
          : '¡Producto guardado correctamente!',
      );

      this.runInAngular(() => {
        this.itemModalOpen = false;
        this.currentImageUrl =
          uploadedImage?.downloadUrl ?? previousImageUrl;
        this.clearSelectedImage();
      });
    } catch (error) {
      console.error(
        '[CatalogPage] No fue posible guardar el producto:',
        this.getSafeErrorDetails(error),
      );

      const fallback = this.savePhase === 'uploadingImage'
        ? 'No se pudo subir la imagen.'
        : 'No se pudo guardar el producto en Firestore.';
      this.runInAngular(() => {
        this.errorMessage = this.getErrorMessage(
          error,
          fallback,
        );
      });
      this.notificationService.error(
        this.getSafeNotificationError(error, fallback),
      );
    } finally {
      this.runInAngular(() => {
        this.savingItem = false;
        this.uploadingImage = false;
        this.uploadProgress = 0;
        this.savePhase = 'idle';
      });
    }
  }

  onProductImageSelected(event: Event): void {
    this.imageError = null;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (!file) {
      return;
    }

    const validationError = getProductImageValidationError(file);

    if (validationError) {
      this.clearSelectedImage();
      this.imageError = validationError;
      return;
    }

    this.releaseImagePreview();
    this.selectedImage = file;
    this.imagePreviewUrl = URL.createObjectURL(file);
  }

  removeSelectedImage(): void {
    this.clearSelectedImage();
    this.imageError = null;
  }

  addProductSize(): void {
    this.productSizes.push(this.createProductSizeGroup());
  }

  removeProductSize(index: number): void {
    this.productSizes.removeAt(index);
  }

  addInclude(): void {
    this.includes.push(this.formBuilder.control(''));
  }

  removeInclude(index: number): void {
    this.includes.removeAt(index);
  }


  openCreateCategory(): void {
    this.clearFeedback();
    this.editingCategoryId = null;

    this.categoryForm.reset({
      name: '',
      status: 'active',
      sortOrder: this.categories.length,
    });

    this.categoryModalOpen = true;
  }

  openEditCategory(category: Category): void {
    this.clearFeedback();
    this.editingCategoryId = category.id;

    this.categoryForm.reset({
      name: category.name,
      status: category.status,
      sortOrder: category.sortOrder,
    });

    this.categoryModalOpen = true;
  }

  async saveCategory(): Promise<void> {
    if (this.categoryForm.invalid || this.savingCategory) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();

    const category: CategoryInput = {
      catalogId: this.catalogId,
      name: value.name.trim(),
      status: value.status,
      sortOrder: value.sortOrder,
    };

    this.savingCategory = true;
    this.clearFeedback();

    try {
      if (this.editingCategoryId) {
        const categoryId = this.editingCategoryId;

        await this.categoryService.updateCategory(
          categoryId,
          category,
        );

        this.runInAngular(() => {
          this.categories = this.categories
            .map((existing) =>
              existing.id === categoryId
                ? { ...existing, ...category }
                : existing,
            )
            .sort((first, second) => first.sortOrder - second.sortOrder);

          this.successMessage = 'Categoría actualizada correctamente.';
        });
        this.notificationService.success(
          'Categoría actualizada correctamente.',
        );
      } else {
        const categoryId =
          await this.categoryService.createCategory(category);

        this.runInAngular(() => {
          this.categories = [
            ...this.categories,
            { id: categoryId, ...category },
          ].sort((first, second) => first.sortOrder - second.sortOrder);

          this.successMessage = 'Categoría creada correctamente.';
        });
        this.notificationService.success('¡Categoría creada correctamente!');
      }

      this.runInAngular(() => {
        this.categoryModalOpen = false;
      });
    } catch (error) {
      console.error(
        '[CatalogPage] No fue posible guardar la categoría:',
        error,
      );

      this.runInAngular(() => {
        this.errorMessage = this.getErrorMessage(
          error,
          'No fue posible guardar la categoría.',
        );
      });
      this.notificationService.error(
        this.getSafeNotificationError(
          error,
          'No fue posible guardar la categoría.',
        ),
      );
    } finally {
      this.runInAngular(() => {
        this.savingCategory = false;
      });
    }
  }

  openCreateDeliveryZone(): void {
    this.clearFeedback();
    this.editingDeliveryZoneId = null;
    this.deliveryZoneForm.reset({
      name: '',
      description: '',
      status: 'active',
      sortOrder: this.deliveryZones.length,
    });
    this.deliveryZoneModalOpen = true;
  }

  openEditDeliveryZone(zone: DeliveryZone): void {
    this.clearFeedback();
    this.editingDeliveryZoneId = zone.id;
    this.deliveryZoneForm.reset({
      name: zone.name,
      status: zone.status,
      sortOrder: zone.sortOrder,
    });
    this.deliveryZoneModalOpen = true;
  }

  closeDeliveryZoneModal(): void {
    if (this.savingDeliveryZone) return;
    this.deliveryZoneModalOpen = false;
    this.editingDeliveryZoneId = null;
    this.deliveryZoneForm.reset({
      name: '',
      description: '',
      status: 'active',
      sortOrder: this.deliveryZones.length,
    });
  }

  async saveDeliveryZone(): Promise<void> {
    if (this.deliveryZoneForm.invalid || this.savingDeliveryZone) {
      this.deliveryZoneForm.markAllAsTouched();
      return;
    }

    const value = this.deliveryZoneForm.getRawValue();
    const input: DeliveryZoneInput = {
      catalogId: this.catalogId,
      name: value.name.trim(),
      status: value.status,
      sortOrder: value.sortOrder,
    };

    this.savingDeliveryZone = true;
    this.clearFeedback();

    try {
      if (this.editingDeliveryZoneId) {
        const id = this.editingDeliveryZoneId;
        await this.deliveryZoneService.updateDeliveryZone(id, input);
        this.runInAngular(() => {
          this.deliveryZones = this.deliveryZones
            .map((zone) => zone.id === id ? { ...zone, ...input } : zone)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
          this.successMessage = 'Zona de entrega actualizada correctamente.';
        });
        this.notificationService.success('Zona de entrega actualizada correctamente.');
      } else {
        const id = await this.deliveryZoneService.createDeliveryZone(input);
        this.runInAngular(() => {
          this.deliveryZones = [...this.deliveryZones, { id, ...input }]
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
          this.successMessage = 'Zona de entrega creada correctamente.';
        });
        this.notificationService.success('Zona de entrega creada correctamente.');
      }

      this.runInAngular(() => {
        this.deliveryZoneModalOpen = false;
        this.editingDeliveryZoneId = null;
      });
    } catch (error) {
      console.error('[CatalogPage] No fue posible guardar la zona de entrega:', error);
      this.runInAngular(() => {
        this.errorMessage = this.getErrorMessage(error, 'No fue posible guardar la zona de entrega.');
      });
      this.notificationService.error(
        this.getSafeNotificationError(error, 'No fue posible guardar la zona de entrega.'),
      );
    } finally {
      this.runInAngular(() => {
        this.savingDeliveryZone = false;
      });
    }
  }

  requestDeliveryZoneDeletion(zone: DeliveryZone): void {
    this.pendingDeletion = {
      kind: 'deliveryZone',
      id: zone.id,
      label: zone.name,
    };
  }

  requestItemDeletion(item: CatalogItem): void {
    this.pendingDeletion = {
      kind: 'item',
      id: item.id,
      label: item.name,
    };
  }

  requestCategoryDeletion(category: Category): void {
    this.pendingDeletion = {
      kind: 'category',
      id: category.id,
      label: category.name,
    };
  }

  async confirmDeletion(): Promise<void> {
    const deletion = this.pendingDeletion;

    if (!deletion || this.deleting) {
      return;
    }

    this.deleting = true;
    this.clearFeedback();

    try {
      if (deletion.kind === 'item') {
        const itemToDelete = this.items.find(
          (item) => item.id === deletion.id,
        );

        await this.catalogService.deleteItem(
          this.catalogId,
          deletion.id,
        );

        this.runInAngular(() => {
          this.items = this.items.filter(
            (item) => item.id !== deletion.id,
          );

          this.successMessage = 'Producto eliminado correctamente.';
        });
        if (itemToDelete?.imageUrl) {
          try {
            await this.storageService.deleteProductImage(
              itemToDelete.imageUrl,
            );
          } catch (cleanupError) {
            console.error(
              '[CatalogPage] Producto eliminado, pero no se pudo eliminar su imagen:',
              cleanupError,
            );

            this.runInAngular(() => {
              this.successMessage +=
                ' No se pudo eliminar su imagen de Storage; el documento ya fue eliminado.';
            });
          }
        }
        this.notificationService.success('Producto eliminado correctamente.');
      } else if (deletion.kind === 'category') {
        await this.categoryService.deleteCategory(deletion.id);

        this.runInAngular(() => {
          this.categories = this.categories.filter(
            (category) => category.id !== deletion.id,
          );
          this.successMessage =
            'Categoría eliminada. Los productos existentes conservan su referencia.';
        });
        this.notificationService.success('Categoría eliminada correctamente.');
      } else {
        await this.deliveryZoneService.deleteDeliveryZone(
  deletion.id,
  this.catalogId,
);

        this.runInAngular(() => {
          this.deliveryZones = this.deliveryZones.filter((zone) => zone.id !== deletion.id);
          this.successMessage = 'Zona de entrega eliminada correctamente.';
        });
        this.notificationService.success('Zona de entrega eliminada correctamente.');
      }

      this.runInAngular(() => {
        this.pendingDeletion = null;
      });
    } catch (error) {
      console.error(
        '[CatalogPage] No fue posible eliminar el registro:',
        error,
      );

      this.runInAngular(() => {
        this.errorMessage = this.getErrorMessage(
          error,
          'No fue posible eliminar el registro.',
        );
      });
      this.notificationService.error(
        this.getSafeNotificationError(
          error,
          deletion.kind === 'item'
            ? 'No fue posible eliminar el producto.'
            : deletion.kind === 'category'
              ? 'No fue posible eliminar la categoría.'
              : 'No fue posible eliminar la zona de entrega.', 
        ),
      );
    } finally {
      this.runInAngular(() => {
        this.deleting = false;
      });
    }
  }

  categoryName(categoryId?: string): string {
    if (!categoryId) {
      return 'Sin categoría';
    }

    return (
      this.categories.find((category) => category.id === categoryId)?.name
      ?? 'Categoría no disponible'
    );
  }

  closeItemModal(): void {
    if (!this.savingItem && !this.uploadingImage) {
      this.itemModalOpen = false;
      this.clearSelectedImage();
      this.imageError = null;
    }
  }

  closeCategoryModal(): void {
    if (!this.savingCategory) {
      this.categoryModalOpen = false;
    }
  }

  private clearFeedback(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof Error)) {
      return fallback;
    }

    const code =
      'code' in error && typeof error.code === 'string'
        ? error.code
        : undefined;
    const message = error.message.replace(
      /(https:\/\/firebasestorage\.googleapis\.com\/[^\s?]+)\?[^\s]+/g,
      '$1?[redacted]',
    );

    return code ? `${fallback} [${code}]: ${message}` : message || fallback;
  }

  private getSafeNotificationError(error: unknown, fallback: string): string {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;
    const safeMessages: Record<string, string> = {
      'permission-denied': 'No tienes permisos para realizar esta operación.',
      'firestore/permission-denied':
        'No tienes permisos para realizar esta operación.',
      'storage/unauthorized':
        'No tienes permisos para administrar la imagen del producto.',
      unavailable: 'El servicio no está disponible temporalmente. Inténtalo de nuevo.',
      'firestore/unavailable':
        'El servicio no está disponible temporalmente. Inténtalo de nuevo.',
      'network-request-failed':
        'No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.',
      'auth/network-request-failed':
        'No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.',
      'deadline-exceeded':
        'La operación tardó demasiado. Inténtalo de nuevo.',
      'storage/retry-limit-exceeded':
        'No se pudo completar la carga de la imagen. Inténtalo de nuevo.',
      'storage/canceled': 'Se canceló la carga de la imagen.',
    };

    return code ? safeMessages[code] ?? fallback : fallback;
  }

  private getSafeErrorDetails(error: unknown): {
    code?: string;
    message: string;
  } {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;
    const message =
      error instanceof Error ? error.message : String(error);

    return {
      code,
      message: message.replace(
        /(https:\/\/firebasestorage\.googleapis\.com\/[^\s?]+)\?[^\s]+/g,
        '$1?[redacted]',
      ),
    };
  }

  private releaseImagePreview(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
    }
  }

  private clearSelectedImage(): void {
    this.selectedImage = null;
    this.releaseImagePreview();
  }

  private createProductSizeGroup(
    size?: CatalogProductSize,
  ): ProductSizeFormGroup {
    return this.formBuilder.group({
      id: [size?.id ?? '', Validators.required],
      label: [size?.label ?? '', Validators.required],
      priceMxn: [
        size?.priceMxn ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      subtitle: [size?.subtitle ?? ''],
    });
  }

  private clearCommercialControls(): void {
    this.productSizes.clear();
    this.includes.clear();
  }

  private setCommercialControls(
    commercialData?: CatalogItem['commercialData'],
  ): void {
    this.clearCommercialControls();
    for (const size of commercialData?.productSizes ?? []) {
      this.productSizes.push(this.createProductSizeGroup(size));
    }
    for (const include of commercialData?.includes ?? []) {
      this.includes.push(this.formBuilder.control(include));
    }
  }

  private buildCommercialData(fields: {
    sku: string;
    categoryId: string;
    baseTitle: string;
    basePriceMxn: number;
    description: string;
    productSizes: CatalogProductSize[];
    includes: string[];
    isAvailable: boolean;
  }): CatalogProductCommercialData {
    const current = this.editingCommercialData;

    return {
      ...current,
      id: current?.id ?? this.nextCommercialId(),
      categoryId: fields.categoryId || current?.categoryId || '',
      sku: fields.sku,
      baseTitle: fields.baseTitle,
      basePriceMxn: fields.basePriceMxn,
      description: fields.description,
      productSizes: fields.productSizes,
      includes: fields.includes,
      // Compatibilidad con datos antiguos: las zonas se administrarán globalmente.
      // No se modifican ni se eliminan al editar productos existentes.
      deliveryZones: current?.deliveryZones ?? [],
      isAvailable: fields.isAvailable,
      defaultImages: current?.defaultImages ?? [],
      activeSizeOptions: current?.activeSizeOptions ?? [],
      colorDots: current?.colorDots ?? [],
      badge: current?.badge ?? null,
      menuAssignments: current?.menuAssignments ?? [],
      ui: current?.ui ?? {
        showBadge: true,
        showDeliveryDate: true,
        showColorDots: false,
      },
    };
  }

  /** Genera un código automático para el producto. Se conserva al editarlo. */
  private generateProductCode(): string {
    const catalogPrefix = this.catalogId === 'vip' ? 'CDF-VIP' : 'CDF-NOR';
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    const randomPart =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
        : Math.random().toString(36).slice(2, 8).toUpperCase();

    return `${catalogPrefix}-${date}-${randomPart}`;
  }

  private nextCommercialId(): number {
    return this.items.reduce(
      (maximum, item) =>
        Math.max(maximum, item.commercialData?.id ?? 0),
      0,
    ) + 1;
  }

  private async cleanupFailedUpload(
    uploadedImage: UploadedProductImage | null,
    firestoreError: unknown,
  ): Promise<void> {
    if (!uploadedImage) {
      return;
    }

    try {
      await this.storageService.deleteProductImageByPath(
        uploadedImage.fullPath,
      );
    } catch (cleanupError) {
      console.error(
        '[CatalogPage] Error de Firestore y fallo al limpiar la imagen subida:',
        cleanupError,
      );

      throw new Error(
        `No se pudo guardar el producto (${this.getErrorMessage(firestoreError, 'error de Firestore')}) y tampoco eliminar la imagen subida (${this.getErrorMessage(cleanupError, 'error de Storage')}).`,
      );
    }
  }
}
