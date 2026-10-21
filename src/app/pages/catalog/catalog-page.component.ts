
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
    description: ['', [Validators.maxLength(3000)]],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['MXN', Validators.required],
    categoryId: [''],
    status: ['active' as CatalogItemStatus, Validators.required],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    sku: ['', [Validators.required, Validators.pattern(/\S/)]],
    isAvailable: [true],
    productSizes: this.formBuilder.array<ProductSizeFormGroup>([]),
    includes: this.formBuilder.array<FormControl<string>>([]),
  });


  readonly currencies = [
    { code: 'MXN', name: 'Peso mexicano', symbol: '$', flag: '🇲🇽', country: 'México', flagCode: 'mx' },
    { code: 'USD', name: 'Dólar estadounidense', symbol: 'US$', flag: '🇺🇸', country: 'Estados Unidos', flagCode: 'us' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'Unión Europea', flagCode: 'eu' },
    { code: 'CAD', name: 'Dólar canadiense', symbol: 'CA$', flag: '🇨🇦', country: 'Canadá', flagCode: 'ca' },
    { code: 'GBP', name: 'Libra esterlina', symbol: '£', flag: '🇬🇧', country: 'Reino Unido', flagCode: 'gb' },
    { code: 'COP', name: 'Peso colombiano', symbol: '$', flag: '🇨🇴', country: 'Colombia', flagCode: 'co' },
    { code: 'ARS', name: 'Peso argentino', symbol: '$', flag: '🇦🇷', country: 'Argentina', flagCode: 'ar' },
    { code: 'PEN', name: 'Sol peruano', symbol: 'S/', flag: '🇵🇪', country: 'Perú', flagCode: 'pe' },
    { code: 'CLP', name: 'Peso chileno', symbol: '$', flag: '🇨🇱', country: 'Chile', flagCode: 'cl' },
    { code: 'BRL', name: 'Real brasileño', symbol: 'R$', flag: '🇧🇷', country: 'Brasil', flagCode: 'br' },
    { code: 'UYU', name: 'Peso uruguayo', symbol: '$U', flag: '🇺🇾', country: 'Uruguay', flagCode: 'uy' },
    { code: 'CRC', name: 'Colón costarricense', symbol: '₡', flag: '🇨🇷', country: 'Costa Rica', flagCode: 'cr' },
    { code: 'GTQ', name: 'Quetzal guatemalteco', symbol: 'Q', flag: '🇬🇹', country: 'Guatemala', flagCode: 'gt' },
    { code: 'DOP', name: 'Peso dominicano', symbol: 'RD$', flag: '🇩🇴', country: 'República Dominicana', flagCode: 'do' },
    { code: 'JPY', name: 'Yen japonés', symbol: '¥', flag: '🇯🇵', country: 'Japón', flagCode: 'jp' },
  ];

  currencySearch = '';
  currencyDropdownOpen = false;

  get selectedCurrency() {
    const code = this.itemForm.controls.currency.value;
    return this.currencies.find((currency) => currency.code === code) ?? this.currencies[0];
  }

  get filteredCurrencies() {
    const search = this.currencySearch.trim().toLocaleLowerCase();
    return this.currencies.filter((currency) =>
      `${currency.code} ${currency.name} ${currency.country}`.toLocaleLowerCase().includes(search),
    );
  }

  toggleCurrencyDropdown(): void {
    this.currencyDropdownOpen = !this.currencyDropdownOpen;
    if (this.currencyDropdownOpen) this.currencySearch = '';
  }

  selectCurrency(code: string): void {
    if (!this.currencies.some((currency) => currency.code === code)) return;
    this.itemForm.controls.currency.setValue(code);
    this.itemForm.controls.currency.markAsDirty();
    this.itemForm.controls.currency.markAsTouched();
    this.currencyDropdownOpen = false;
    this.currencySearch = '';
  }

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
  /** Imágenes ya guardadas en Storage/Firestore que se conservarán al guardar. */
  existingImageUrls: string[] = [];
  /** Archivos nuevos elegidos en el formulario (máximo 3 imágenes en total). */
  selectedImages: File[] = [];
  selectedImagePreviewUrls: string[] = [];
  /** URLs que el usuario quitó y que se eliminarán de Storage tras guardar. */
  private removedImageUrls: string[] = [];

  get totalProductImages(): number {
    return this.existingImageUrls.length + this.selectedImages.length;
  }

  get canAddProductImage(): boolean {
    return this.totalProductImages < 3;
  }
  private editingCommercialData?: CatalogProductCommercialData;
  private lastLoggedUploadProgress = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.releaseImagePreviews());
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
      currency: 'MXN',
      categoryId: '',
      status: 'active',
      sortOrder: 0,
      sku: '',
      isAvailable: true,
    });
    this.clearCommercialControls();

    this.existingImageUrls = [];
    this.removedImageUrls = [];
    this.clearSelectedImages();
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
        this.existingImageUrls = this.getProductImageUrls(currentItem);
        this.removedImageUrls = [];
        this.clearSelectedImages();
        this.imageError = null;

        this.itemForm.reset({
          code: currentItem.code,
          name: currentItem.name,
          description: currentItem.description,
          price: currentItem.price,
          currency: currentItem.commercialData?.currency ?? 'MXN',
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
        currency: value.currency,
        description: value.description.trim(),
        productSizes,
        includes,
        isAvailable: value.isAvailable,
      }),
    };

    this.savingItem = true;
    this.clearFeedback();
    this.imageError = null;

    const uploadedImages: UploadedProductImage[] = [];
    const previousImageUrls = [...this.existingImageUrls];
    const imagesToRemove = [...this.removedImageUrls];
    const updatingItem = this.editingItemId !== null;
    let documentSaved = false;

    try {
      if (this.selectedImages.length > 0) {
        this.uploadingImage = true;
        this.savePhase = 'uploadingImage';
        this.uploadProgress = 0;
        this.lastLoggedUploadProgress = 0;

        for (const file of this.selectedImages) {
          console.info('[CatalogPage] Inicia carga de imagen:', {
            catalogId: this.catalogId,
            sizeBytes: file.size,
            contentType: file.type,
          });

          const uploadedImage = await this.storageService.uploadProductImage(
            this.catalogId,
            item.code,
            file,
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
          uploadedImages.push(uploadedImage);
        }
      }

      this.runInAngular(() => {
        this.savePhase = 'writingDocument';
      });

      const finalImageUrls = [
        ...previousImageUrls,
        ...uploadedImages.map((image) => image.downloadUrl),
      ].filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index).slice(0, 3);

      const itemToSave: CatalogItemInput = {
        ...item,
        imageUrl: finalImageUrls[0] ?? '',
        commercialData: item.commercialData
          ? { ...item.commercialData, defaultImages: finalImageUrls }
          : undefined,
      };

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

      documentSaved = true;
      const urlsToDelete = imagesToRemove.filter((url) => !finalImageUrls.includes(url));
      for (const imageUrl of urlsToDelete) {
        try {
          await this.storageService.deleteProductImage(imageUrl);
        } catch (cleanupError) {
          console.error('[CatalogPage] Producto guardado, pero no se pudo eliminar una imagen retirada:', cleanupError);
          this.runInAngular(() => {
            this.successMessage += ' No fue posible eliminar una de las imágenes retiradas de Storage.';
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
        this.existingImageUrls = finalImageUrls;
        this.removedImageUrls = [];
        this.clearSelectedImages();
      });
    } catch (error) {
      if (!documentSaved && uploadedImages.length > 0) {
        try {
          await this.cleanupFailedUploads(uploadedImages, error);
        } catch (cleanupError) {
          console.error('[CatalogPage] Falló la limpieza de imágenes tras un error al guardar:', cleanupError);
        }
      }
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
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (files.length === 0) return;

    if (!this.canAddProductImage) {
      this.imageError = 'Cada producto puede tener como máximo 3 imágenes.';
      return;
    }

    const acceptedFiles: File[] = [];
    for (const file of files) {
      if (this.totalProductImages + acceptedFiles.length >= 3) {
        this.imageError = 'Solo puedes cargar hasta 3 imágenes por producto.';
        break;
      }
      const validationError = getProductImageValidationError(file);
      if (validationError) {
        this.imageError = validationError;
        continue;
      }
      acceptedFiles.push(file);
    }

    for (const file of acceptedFiles) {
      this.selectedImages.push(file);
      this.selectedImagePreviewUrls.push(URL.createObjectURL(file));
    }
  }

  removeExistingProductImage(index: number): void {
    const [removedUrl] = this.existingImageUrls.splice(index, 1);
    if (removedUrl && !this.removedImageUrls.includes(removedUrl)) {
      this.removedImageUrls.push(removedUrl);
    }
    this.imageError = null;
  }

  removeSelectedProductImage(index: number): void {
    const [previewUrl] = this.selectedImagePreviewUrls.splice(index, 1);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    this.selectedImages.splice(index, 1);
    this.imageError = null;
  }

  private getProductImageUrls(item: CatalogItem): string[] {
    const commercialImages = item.commercialData?.defaultImages ?? [];
    return [item.imageUrl, ...commercialImages]
      .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      .filter((url, index, urls) => urls.indexOf(url) === index)
      .slice(0, 3);
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
        if (itemToDelete) {
          const imageUrls = this.getProductImageUrls(itemToDelete);
          const failedDeletions: string[] = [];
          for (const imageUrl of imageUrls) {
            try {
              await this.storageService.deleteProductImage(imageUrl);
            } catch (cleanupError) {
              failedDeletions.push(imageUrl);
              console.error('[CatalogPage] Producto eliminado, pero no se pudo eliminar una imagen de Storage:', cleanupError);
            }
          }
          if (failedDeletions.length > 0) {
            this.runInAngular(() => {
              this.successMessage += ` No se pudieron eliminar ${failedDeletions.length} imagen(es) de Storage; el documento ya fue eliminado.`;
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
      this.clearSelectedImages();
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

  private releaseImagePreviews(): void {
    for (const previewUrl of this.selectedImagePreviewUrls) {
      URL.revokeObjectURL(previewUrl);
    }
    this.selectedImagePreviewUrls = [];
  }

  private clearSelectedImages(): void {
    this.selectedImages = [];
    this.releaseImagePreviews();
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
    currency: string;
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
      currency: fields.currency,
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

  private async cleanupFailedUploads(
    uploadedImages: UploadedProductImage[],
    firestoreError: unknown,
  ): Promise<void> {
    const cleanupErrors: unknown[] = [];
    for (const uploadedImage of uploadedImages) {
      try {
        await this.storageService.deleteProductImageByPath(uploadedImage.fullPath);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
        console.error('[CatalogPage] No se pudo limpiar una imagen tras fallar Firestore:', cleanupError);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new Error(
        `No se pudo guardar el producto (${this.getErrorMessage(firestoreError, 'error de Firestore')}) y no se pudieron limpiar ${cleanupErrors.length} imagen(es) subida(s).`,
      );
    }
  }

}
