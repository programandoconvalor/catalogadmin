
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandingComponent } from './branding.component';
import { BrandingIdentityService } from '../../core/branding/branding-identity.service';
import { NotificationService } from '../../core/notifications/notification.service';

describe('BrandingComponent', () => {
  let fixture: ComponentFixture<BrandingComponent>;
  let component: BrandingComponent;
  let brandingService: jasmine.SpyObj<BrandingIdentityService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const identity = {
    storeName: 'Cielito de Flores',
    tagline: 'Regala siempre una sonrisa',
    logoUrl: 'https://example.com/logo.png',
    logoStoragePath: 'tenants/cielitodeflores/branding/images/logo.png',
    faviconUrl: 'https://example.com/favicon.png',
    faviconStoragePath: 'tenants/cielitodeflores/branding/images/favicon.png',
  };

  beforeEach(async () => {
    brandingService = jasmine.createSpyObj<BrandingIdentityService>(
      'BrandingIdentityService',
      ['getIdentity', 'saveIdentity', 'uploadImage', 'deleteImageByPath'],
    );

    notificationService = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['success', 'error', 'warning', 'info', 'dismiss'],
    );

    brandingService.getIdentity.and.resolveTo(identity);
    brandingService.saveIdentity.and.resolveTo();
    brandingService.uploadImage.and.resolveTo({
      downloadUrl: 'https://example.com/new-image.png',
      fullPath: 'tenants/cielitodeflores/branding/images/new-image.png',
    });
    brandingService.deleteImageByPath.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [BrandingComponent],
      providers: [
        {
          provide: BrandingIdentityService,
          useValue: brandingService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandingComponent);
    component = fixture.componentInstance;
  });

  it('loads the existing branding identity', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(brandingService.getIdentity).toHaveBeenCalled();
    expect(component.brandingForm.getRawValue()).toEqual({
      storeName: 'Cielito de Flores',
      tagline: 'Regala siempre una sonrisa',
    });
    expect(component.logoPreviewUrl).toBe(identity.logoUrl);
    expect(component.faviconPreviewUrl).toBe(identity.faviconUrl);
    expect(component.loading).toBeFalse();
  });

  it('shows an empty form when no branding identity exists', async () => {
    brandingService.getIdentity.and.resolveTo(null);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.brandingForm.getRawValue()).toEqual({
      storeName: '',
      tagline: '',
    });
    expect(component.logoPreviewUrl).toBeNull();
    expect(component.faviconPreviewUrl).toBeNull();
  });

  it('requires a valid store name', () => {
    component.brandingForm.controls.storeName.setValue('');

    expect(component.brandingForm.controls.storeName.invalid).toBeTrue();

    component.brandingForm.controls.storeName.setValue('   ');

    expect(component.brandingForm.controls.storeName.invalid).toBeTrue();

    component.brandingForm.controls.storeName.setValue('Nueva Florería');

    expect(component.brandingForm.controls.storeName.valid).toBeTrue();
  });

  it('rejects saving when the store name is empty', async () => {
    component.brandingForm.controls.storeName.setValue('');

    await component.saveIdentity();

    expect(brandingService.saveIdentity).not.toHaveBeenCalled();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('saves the text fields and preserves existing image references', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.brandingForm.patchValue({
      storeName: '  Cielito de Flores  ',
      tagline: '  Regala momentos especiales  ',
    });

    await component.saveIdentity();

    expect(brandingService.saveIdentity).toHaveBeenCalledOnceWith({
      storeName: 'Cielito de Flores',
      tagline: 'Regala momentos especiales',
      logoUrl: identity.logoUrl,
      logoStoragePath: identity.logoStoragePath,
      faviconUrl: identity.faviconUrl,
      faviconStoragePath: identity.faviconStoragePath,
    });

    expect(notificationService.success).toHaveBeenCalled();
    expect(component.saving).toBeFalse();
  });

  it('uploads a new logo before saving its reference', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const file = new File(['image-content'], 'new-logo.png', {
      type: 'image/png',
    });

    component.selectedLogo = file;

    await component.saveIdentity();

    expect(brandingService.uploadImage).toHaveBeenCalledOnceWith(
      'logo',
      file,
    );

    expect(brandingService.saveIdentity).toHaveBeenCalledWith(
      jasmine.objectContaining({
        logoUrl: 'https://example.com/new-image.png',
        logoStoragePath:
          'tenants/cielitodeflores/branding/images/new-image.png',
      }),
    );

    expect(brandingService.deleteImageByPath).toHaveBeenCalledWith(
      identity.logoStoragePath,
    );
  });

  it('uploads a new favicon before saving its reference', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const file = new File(['image-content'], 'new-favicon.png', {
      type: 'image/png',
    });

    component.selectedFavicon = file;

    await component.saveIdentity();

    expect(brandingService.uploadImage).toHaveBeenCalledOnceWith(
      'favicon',
      file,
    );

    expect(brandingService.saveIdentity).toHaveBeenCalledWith(
      jasmine.objectContaining({
        faviconUrl: 'https://example.com/new-image.png',
        faviconStoragePath:
          'tenants/cielitodeflores/branding/images/new-image.png',
      }),
    );

    expect(brandingService.deleteImageByPath).toHaveBeenCalledWith(
      identity.faviconStoragePath,
    );
  });

  it('does not delete the previous image when Firestore save fails', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const file = new File(['image-content'], 'new-logo.png', {
      type: 'image/png',
    });

    component.selectedLogo = file;

    brandingService.saveIdentity.and.rejectWith(
      new Error('No fue posible guardar en Firestore.'),
    );

    await component.saveIdentity();

    expect(brandingService.uploadImage).toHaveBeenCalled();
    expect(brandingService.deleteImageByPath).toHaveBeenCalledWith(
      'tenants/cielitodeflores/branding/images/new-image.png',
    );
    expect(brandingService.deleteImageByPath).not.toHaveBeenCalledWith(
      identity.logoStoragePath,
    );
    expect(notificationService.error).toHaveBeenCalled();
    expect(component.saving).toBeFalse();
  });

  it('restores the original image previews when resetting the form', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.logoPreviewUrl = 'blob:temporary-logo';
    component.faviconPreviewUrl = 'blob:temporary-favicon';

    component.selectedLogo = new File(['logo'], 'logo.png', {
      type: 'image/png',
    });

    component.selectedFavicon = new File(['favicon'], 'favicon.png', {
      type: 'image/png',
    });

    component.resetForm();

    expect(component.selectedLogo).toBeNull();
    expect(component.selectedFavicon).toBeNull();
    expect(component.logoPreviewUrl).toBe(identity.logoUrl);
    expect(component.faviconPreviewUrl).toBe(identity.faviconUrl);
    expect(component.hasChanges).toBeFalse();
  });
});
