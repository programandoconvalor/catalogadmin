import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogService } from '../../core/catalog/catalog.service';
import { CategoryService } from '../../core/catalog/category.service';
import { DeliveryZoneService } from '../../core/catalog/delivery-zone.service';
import { ProductsComponent } from './products.component';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;

  beforeEach(async () => {
    const catalogService = jasmine.createSpyObj<CatalogService>(
      'CatalogService',
      ['getItems'],
    );
    const categoryService = jasmine.createSpyObj<CategoryService>(
      'CategoryService',
      ['getCategories'],
    );
    const deliveryZoneService = jasmine.createSpyObj<DeliveryZoneService>(
      'DeliveryZoneService',
      ['getDeliveryZones'],
    );
    catalogService.getItems.and.resolveTo([]);
    categoryService.getCategories.and.resolveTo([]);
    deliveryZoneService.getDeliveryZones.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [
        { provide: CatalogService, useValue: catalogService },
        { provide: CategoryService, useValue: categoryService },
        { provide: DeliveryZoneService, useValue: deliveryZoneService },
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
});
