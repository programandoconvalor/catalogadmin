import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';

import { CategoryService } from '../../core/catalog/category.service';
import type { Category } from '../../core/models/category.model';
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
});
