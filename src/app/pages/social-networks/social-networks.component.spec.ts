/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ManagedStoreSocialNetwork,
  SOCIAL_NETWORK_CATALOG_ID,
  StoreSocialNetworkId,
} from '../../core/models/social-network.model';
import { NotificationService } from '../../core/notifications/notification.service';
import {
  getSocialNetworkUrlError,
  SocialNetworkService,
  StoreSocialNetworkInput,
} from '../../core/social-networks/social-network.service';
import { SocialNetworksComponent } from './social-networks.component';

describe('SocialNetworksComponent', () => {
  let fixture: ComponentFixture<SocialNetworksComponent>;
  let socialNetworkService: jasmine.SpyObj<SocialNetworkService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const createNetwork = (
    network: StoreSocialNetworkId,
    sortOrder: number,
    status: 'active' | 'inactive' = 'active',
  ): ManagedStoreSocialNetwork => ({
    id: network,
    catalogId: SOCIAL_NETWORK_CATALOG_ID,
    network,
    url: `https://${network}.com/floreria`,
    sortOrder,
    status,
  });

  async function loadNetworks(
    networks: ManagedStoreSocialNetwork[] = [],
  ): Promise<void> {
    socialNetworkService.getSocialNetworks.and.resolveTo(networks);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    spyOn(console, 'error');
    socialNetworkService = jasmine.createSpyObj<SocialNetworkService>(
      'SocialNetworkService',
      [
        'getSocialNetworks',
        'createSocialNetwork',
        'updateSocialNetwork',
        'deleteSocialNetwork',
      ],
    );
    socialNetworkService.getSocialNetworks.and.resolveTo([]);
    socialNetworkService.createSocialNetwork.and.resolveTo(undefined);
    socialNetworkService.updateSocialNetwork.and.resolveTo(undefined);
    socialNetworkService.deleteSocialNetwork.and.resolveTo(undefined);

    notificationService = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['success', 'error', 'warning', 'info', 'dismiss'],
    );

    await TestBed.configureTestingModule({
      imports: [SocialNetworksComponent],
      providers: [
        { provide: SocialNetworkService, useValue: socialNetworkService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialNetworksComponent);
  });

  it('loads records in display order and makes one request', async () => {
    await loadNetworks([
      createNetwork('instagram', 2),
      createNetwork('facebook', 1),
    ]);

    expect(
      fixture.componentInstance.networks.map(({ network }) => network),
    ).toEqual(['facebook', 'instagram']);
    expect(socialNetworkService.getSocialNetworks).toHaveBeenCalledOnceWith(
      SOCIAL_NETWORK_CATALOG_ID,
    );
    expect(fixture.nativeElement.textContent).toContain('Mostrando');
  });

  it('filters by network name and URL immediately without another request', async () => {
    await loadNetworks([
      createNetwork('facebook', 1),
      {
        ...createNetwork('instagram', 2),
        url: 'https://instagram.com/cielitodeflores',
      },
    ]);

    const component = fixture.componentInstance;
    component.onSearchChange('cielito');

    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'instagram',
    ]);
    component.onSearchChange('facebook');
    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'facebook',
    ]);
    expect(socialNetworkService.getSocialNetworks).toHaveBeenCalledTimes(1);
  });

  it('validates complete URLs and requires a domain for the selected network', () => {
    expect(
      getSocialNetworkUrlError('instagram', 'https://instagram.com/flores'),
    ).toBeNull();
    expect(
      getSocialNetworkUrlError('instagram', 'https://facebook.com/flores'),
    ).toContain('Instagram');
    expect(getSocialNetworkUrlError('facebook', 'facebook.com/flores')).toBe(
      'Ingresa una URL completa y válida.',
    );
    expect(
      getSocialNetworkUrlError('whatsapp', 'javascript:alert(1)'),
    ).toContain('http:// o https://');
  });

  it('creates a network, updates the list immediately, and closes the form', async () => {
    await loadNetworks([createNetwork('facebook', 1)]);
    const component = fixture.componentInstance;
    component.openCreateNetwork();
    component.socialForm.setValue({
      network: 'instagram',
      url: 'https://instagram.com/cielitodeflores',
      sortOrder: 2,
      status: 'inactive',
    });

    await component.saveNetwork();

    const expected: StoreSocialNetworkInput = {
      network: 'instagram',
      url: 'https://instagram.com/cielitodeflores',
      sortOrder: 2,
      status: 'inactive',
    };
    expect(socialNetworkService.createSocialNetwork).toHaveBeenCalledOnceWith(
      SOCIAL_NETWORK_CATALOG_ID,
      expected,
    );
    expect(component.networks.map(({ network }) => network)).toEqual([
      'facebook',
      'instagram',
    ]);
    expect(component.modalOpen).toBeFalse();
    expect(component.saving).toBeFalse();
    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Red social agregada correctamente.',
    );
  });

  it('updates all editable fields while retaining the original identity for the request', async () => {
    const existing = createNetwork('facebook', 1);
    await loadNetworks([existing]);
    const component = fixture.componentInstance;
    component.openEditNetwork(existing);
    component.socialForm.setValue({
      network: 'youtube',
      url: 'https://youtube.com/cielitodeflores',
      sortOrder: 3,
      status: 'inactive',
    });

    await component.saveNetwork();

    expect(socialNetworkService.updateSocialNetwork).toHaveBeenCalledOnceWith(
      SOCIAL_NETWORK_CATALOG_ID,
      'facebook',
      {
        network: 'youtube',
        url: 'https://youtube.com/cielitodeflores',
        sortOrder: 3,
        status: 'inactive',
      },
    );
    expect(component.networks).toEqual([
      {
        catalogId: SOCIAL_NETWORK_CATALOG_ID,
        id: 'youtube',
        network: 'youtube',
        url: 'https://youtube.com/cielitodeflores',
        sortOrder: 3,
        status: 'inactive',
      },
    ]);
    expect(component.modalOpen).toBeFalse();
  });

  it('uses the existing Firestore document ID when editing and deleting Facebook', async () => {
    const facebook = { ...createNetwork('facebook', 1), id: 'socials' };
    await loadNetworks([facebook]);
    const component = fixture.componentInstance;

    component.openEditNetwork(facebook);
    component.socialForm.setValue({
      network: 'facebook',
      url: 'https://facebook.com/cielitodeflores',
      sortOrder: 1,
      status: 'active',
    });
    await component.saveNetwork();

    expect(socialNetworkService.updateSocialNetwork).toHaveBeenCalledOnceWith(
      SOCIAL_NETWORK_CATALOG_ID,
      'socials',
      {
        network: 'facebook',
        url: 'https://facebook.com/cielitodeflores',
        sortOrder: 1,
        status: 'active',
      },
    );
    expect(component.networks[0].id).toBe('socials');

    component.requestDeletion(component.networks[0]);
    await component.confirmDeletion();

    expect(socialNetworkService.deleteSocialNetwork).toHaveBeenCalledOnceWith(
      SOCIAL_NETWORK_CATALOG_ID,
      'socials',
    );
    expect(component.networks).toEqual([]);
  });

  it('deletes only after confirmation and refreshes the list in memory', async () => {
    const facebook = createNetwork('facebook', 1);
    const instagram = createNetwork('instagram', 2);
    await loadNetworks([facebook, instagram]);

    const component = fixture.componentInstance;
    component.requestDeletion(facebook);
    expect(component.networks).toHaveSize(2);
    await component.confirmDeletion();

    expect(socialNetworkService.deleteSocialNetwork).toHaveBeenCalledOnceWith(
      SOCIAL_NETWORK_CATALOG_ID,
      'facebook',
    );
    expect(component.networks).toEqual([instagram]);
    expect(component.pendingDeletion).toBeNull();
    expect(notificationService.success).toHaveBeenCalledOnceWith(
      'Red social eliminada correctamente.',
    );
  });

  it('rejects duplicate platforms and orders without calling Firebase', async () => {
    await loadNetworks([
      createNetwork('facebook', 1),
      createNetwork('instagram', 2),
    ]);
    const component = fixture.componentInstance;
    component.openCreateNetwork();
    component.socialForm.setValue({
      network: 'facebook',
      url: 'https://facebook.com/cielitodeflores',
      sortOrder: 2,
      status: 'active',
    });

    await component.saveNetwork();

    expect(socialNetworkService.createSocialNetwork).not.toHaveBeenCalled();
    expect(component.modalOpen).toBeTrue();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('rejects a URL from a different platform before saving', async () => {
    await loadNetworks();
    const component = fixture.componentInstance;
    component.openCreateNetwork();
    component.socialForm.setValue({
      network: 'instagram',
      url: 'https://facebook.com/cielitodeflores',
      sortOrder: 1,
      status: 'active',
    });

    await component.saveNetwork();

    expect(socialNetworkService.createSocialNetwork).not.toHaveBeenCalled();
    expect(notificationService.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/Instagram/),
    );
  });

  it('enforces the five-network limit and calculates the next order', async () => {
    const networks = [
      createNetwork('facebook', 1),
      createNetwork('instagram', 3),
      createNetwork('whatsapp', 4),
      createNetwork('tiktok', 5),
      createNetwork('youtube', 6),
    ];
    await loadNetworks(networks);
    const component = fixture.componentInstance;

    expect(component.canCreateNetwork).toBeFalse();
    expect(component.nextSortOrder).toBe(7);
    component.openCreateNetwork();
    expect(component.modalOpen).toBeFalse();

    fixture.detectChanges();
    const createButton = fixture.nativeElement.querySelector(
      '.social-primary-button',
    ) as HTMLButtonElement;
    expect(createButton.disabled).toBeTrue();
  });

  it('keeps only active networks in the public-preview collection and sorts them', async () => {
    await loadNetworks([
      createNetwork('instagram', 4),
      createNetwork('facebook', 3, 'inactive'),
      createNetwork('whatsapp', 1),
    ]);

    expect(
      fixture.componentInstance.activeNetworks.map(({ network }) => network),
    ).toEqual(['whatsapp', 'instagram']);
  });

  it('reports load failures and exits the loading state', async () => {
    socialNetworkService.getSocialNetworks.and.rejectWith(
      new Error('No fue posible consultar Firestore.'),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.componentInstance.errorMessage).toBe(
      'No fue posible consultar Firestore.',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Todavía no hay redes sociales',
    );
    expect(
      fixture.nativeElement.querySelector('.social-list-footer'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.social-primary-button',
      ).disabled,
    ).toBeTrue();
    expect(notificationService.error).toHaveBeenCalledOnceWith(
      'No fue posible consultar Firestore.',
    );
  });

  it('reports save errors, preserves the open form, and unlocks the button', async () => {
    await loadNetworks();
    socialNetworkService.createSocialNetwork.and.rejectWith(
      new Error('No fue posible guardar en Firestore.'),
    );
    const component = fixture.componentInstance;
    component.openCreateNetwork();
    component.socialForm.setValue({
      network: 'facebook',
      url: 'https://facebook.com/cielitodeflores',
      sortOrder: 1,
      status: 'active',
    });

    await component.saveNetwork();

    expect(component.modalOpen).toBeTrue();
    expect(component.saving).toBeFalse();
    expect(notificationService.error).toHaveBeenCalledWith(
      'No fue posible guardar en Firestore.',
    );
  });

  it('reports deletion errors and keeps the record visible', async () => {
    const facebook = createNetwork('facebook', 1);
    await loadNetworks([facebook]);
    socialNetworkService.deleteSocialNetwork.and.rejectWith(
      new Error('No fue posible eliminar en Firestore.'),
    );
    const component = fixture.componentInstance;
    component.requestDeletion(facebook);

    await component.confirmDeletion();

    expect(component.networks).toEqual([facebook]);
    expect(component.deleting).toBeFalse();
    expect(notificationService.error).toHaveBeenCalledWith(
      'No fue posible eliminar en Firestore.',
    );
  });

  it('filters records by active and inactive status', async () => {
    await loadNetworks([
      createNetwork('facebook', 1),
      createNetwork('instagram', 2, 'inactive'),
    ]);

    const component = fixture.componentInstance;
    component.onStatusFilterChange('active');
    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'facebook',
    ]);

    component.onStatusFilterChange('inactive');
    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'instagram',
    ]);
  });

  it('sorts by network name in ascending and descending order', async () => {
    await loadNetworks([
      createNetwork('tiktok', 1),
      createNetwork('facebook', 2),
      createNetwork('instagram', 3),
    ]);
    const component = fixture.componentInstance;
    component.onSortChange('name');

    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'facebook',
      'instagram',
      'tiktok',
    ]);

    component.toggleSortDirection();
    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'tiktok',
      'instagram',
      'facebook',
    ]);
  });

  it('sorts by custom order and reverses the order with the direction control', async () => {
    await loadNetworks([
      createNetwork('instagram', 3),
      createNetwork('facebook', 1),
      createNetwork('tiktok', 2),
    ]);
    const component = fixture.componentInstance;

    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'facebook',
      'tiktok',
      'instagram',
    ]);

    component.toggleSortDirection();
    expect(component.filteredNetworks.map(({ network }) => network)).toEqual([
      'instagram',
      'tiktok',
      'facebook',
    ]);
  });

  it('limits displayed records to the selected page size and reports visible ranges', async () => {
    await loadNetworks([
      createNetwork('facebook', 1),
      createNetwork('instagram', 2),
      createNetwork('tiktok', 3),
      createNetwork('youtube', 4),
    ]);
    const component = fixture.componentInstance;
    component.onPageSizeChange('2');
    component.goToPage(2);

    expect(component.paginatedNetworks.map(({ network }) => network)).toEqual([
      'tiktok',
      'youtube',
    ]);
    expect(component.totalPages).toBe(2);
    expect(component.firstVisibleItem).toBe(3);
    expect(component.lastVisibleItem).toBe(4);
  });

  it('resets pagination when search, status, sorting, or page size changes', async () => {
    await loadNetworks([
      createNetwork('facebook', 1),
      createNetwork('instagram', 2),
      createNetwork('tiktok', 3),
      createNetwork('youtube', 4),
    ]);
    const component = fixture.componentInstance;
    component.onPageSizeChange('2');
    component.goToPage(2);

    component.onSearchChange('instagram');
    expect(component.currentPage).toBe(1);
    component.goToPage(2);
    component.onStatusFilterChange('active');
    expect(component.currentPage).toBe(1);
    component.goToPage(2);
    component.onSortChange('name');
    expect(component.currentPage).toBe(1);
    component.goToPage(2);
    component.toggleSortDirection();
    expect(component.currentPage).toBe(1);
    component.goToPage(2);
    component.onPageSizeChange('3');
    expect(component.currentPage).toBe(1);
  });

  it('clamps page navigation to the first and last available page', async () => {
    await loadNetworks([
      createNetwork('facebook', 1),
      createNetwork('instagram', 2),
      createNetwork('tiktok', 3),
      createNetwork('youtube', 4),
    ]);
    const component = fixture.componentInstance;
    component.onPageSizeChange('2');
    component.goToPage(9);
    expect(component.currentPage).toBe(2);

    component.goToPage(-2);
    expect(component.currentPage).toBe(1);
  });

  it('allows WhatsApp in the form and creates its profile link', async () => {
    await loadNetworks();
    const component = fixture.componentInstance;
    component.openCreateNetwork();
    fixture.detectChanges();

    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll(
          '.social-input-group select option',
        ) as NodeListOf<HTMLOptionElement>,
      ).map(({ value }) => value),
    ).toContain('whatsapp');

    component.socialForm.setValue({
      network: 'whatsapp',
      url: 'https://wa.me/521234567890',
      sortOrder: 1,
      status: 'active',
    });
    await component.saveNetwork();

    expect(socialNetworkService.createSocialNetwork).toHaveBeenCalledOnceWith(
      SOCIAL_NETWORK_CATALOG_ID,
      {
        network: 'whatsapp',
        url: 'https://wa.me/521234567890',
        sortOrder: 1,
        status: 'active',
      },
    );
    expect(component.modalOpen).toBeFalse();
  });

  it('keeps WhatsApp visible and allows editing its existing profile link', async () => {
    const whatsapp = createNetwork('whatsapp', 1);
    await loadNetworks([whatsapp]);
    const component = fixture.componentInstance;

    expect(component.canEditNetwork(whatsapp)).toBeTrue();
    component.openEditNetwork(whatsapp);
    expect(component.modalOpen).toBeTrue();

    fixture.detectChanges();
    const editButton = fixture.nativeElement.querySelector(
      '.social-row-action.edit',
    ) as HTMLButtonElement;
    expect(editButton.disabled).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('WhatsApp');
  });

  it('ignores unsupported filter, sort, and page-size values', async () => {
    await loadNetworks([createNetwork('facebook', 1)]);
    const component = fixture.componentInstance;

    component.onStatusFilterChange('pending');
    component.onSortChange('url');
    component.onPageSizeChange('99');

    expect(component.statusFilter).toBe('');
    expect(component.sortBy).toBe('order');
    expect(component.pageSize).toBe(5);
  });

  it('shows the empty-filter state without offering an empty-list creation shortcut', async () => {
    await loadNetworks([createNetwork('facebook', 1)]);
    const component = fixture.componentInstance;
    const status = fixture.nativeElement.querySelectorAll(
      '.social-toolbar-select',
    )[0] as HTMLSelectElement;
    status.value = 'inactive';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.hasActiveFilters).toBeTrue();
    expect(component.filteredNetworks).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      'No encontramos redes sociales',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Agregar primera red social',
    );
  });

  describe('simulaciones de uso por usuarios ficticios', () => {
    it('Ana busca una red por nombre y obtiene solo coincidencias', async () => {
      await loadNetworks([
        createNetwork('facebook', 1),
        createNetwork('instagram', 2),
      ]);
      fixture.detectChanges();
      const search = fixture.nativeElement.querySelector(
        '.social-search-field input',
      ) as HTMLInputElement;
      search.value = 'Instagram';
      search.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(fixture.componentInstance.paginatedNetworks.map(({ network }) => network))
        .toEqual(['instagram']);
    });

    it('Bruno filtra su lista para mostrar solo redes inactivas', async () => {
      await loadNetworks([
        createNetwork('facebook', 1),
        createNetwork('instagram', 2, 'inactive'),
      ]);
      fixture.detectChanges();
      const status = fixture.nativeElement.querySelectorAll(
        '.social-toolbar-select',
      )[0] as HTMLSelectElement;
      status.value = 'inactive';
      status.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(fixture.componentInstance.paginatedNetworks.map(({ network }) => network))
        .toEqual(['instagram']);
    });

    it('Carla ordena por nombre y cambia la dirección desde los controles', async () => {
      await loadNetworks([
        createNetwork('instagram', 1),
        createNetwork('facebook', 2),
      ]);
      fixture.detectChanges();
      const sort = fixture.nativeElement.querySelectorAll(
        '.social-toolbar-select',
      )[1] as HTMLSelectElement;
      sort.value = 'name';
      sort.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(fixture.componentInstance.paginatedNetworks[0].network).toBe(
        'facebook',
      );
      const direction = fixture.nativeElement.querySelector(
        '.social-sort-direction',
      ) as HTMLButtonElement;
      direction.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.paginatedNetworks[0].network).toBe(
        'instagram',
      );
    });

    it('Diego recorre páginas usando el tamaño elegido', async () => {
      await loadNetworks([
        createNetwork('facebook', 1),
        createNetwork('instagram', 2),
        createNetwork('tiktok', 3),
        createNetwork('youtube', 4),
      ]);
      fixture.detectChanges();
      const size = fixture.nativeElement.querySelector(
        '.social-page-size',
      ) as HTMLSelectElement;
      size.value = '2';
      size.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        '.social-page-button',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.currentPage).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
      expect(fixture.componentInstance.paginatedNetworks.map(({ network }) => network))
        .toEqual(['tiktok', 'youtube']);
    });

    it('Elena da de alta su perfil de TikTok y lo ve en el listado', async () => {
      await loadNetworks();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector(
        '.social-primary-button',
      ) as HTMLButtonElement).click();
      fixture.detectChanges();
      fixture.componentInstance.socialForm.setValue({
        network: 'tiktok',
        url: 'https://tiktok.com/@elena',
        sortOrder: 1,
        status: 'active',
      });

      await fixture.componentInstance.saveNetwork();
      fixture.detectChanges();

      expect(socialNetworkService.createSocialNetwork).toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('TikTok');
      expect(fixture.componentInstance.modalOpen).toBeFalse();
    });

    it('Fabio modifica el enlace de Facebook sin cambiar la identidad del registro', async () => {
      await loadNetworks([createNetwork('facebook', 1)]);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector(
        '.social-row-action.edit',
      ) as HTMLButtonElement).click();
      fixture.detectChanges();
      fixture.componentInstance.socialForm.controls.url.setValue(
        'https://facebook.com/fabio.flores',
      );
      await fixture.componentInstance.saveNetwork();

      expect(socialNetworkService.updateSocialNetwork).toHaveBeenCalledOnceWith(
        SOCIAL_NETWORK_CATALOG_ID,
        'facebook',
        jasmine.objectContaining({
          url: 'https://facebook.com/fabio.flores',
        }),
      );
      expect(fixture.componentInstance.networks[0].url).toBe(
        'https://facebook.com/fabio.flores',
      );
    });

    it('Gabriela cancela una eliminación y conserva su red', async () => {
      const facebook = createNetwork('facebook', 1);
      await loadNetworks([facebook]);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector(
        '.social-row-action.delete',
      ) as HTMLButtonElement).click();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector(
        '.social-cancel-button',
      ) as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(socialNetworkService.deleteSocialNetwork).not.toHaveBeenCalled();
      expect(fixture.componentInstance.networks).toEqual([facebook]);
    });

    it('Hugo confirma la eliminación y la red desaparece de su lista', async () => {
      await loadNetworks([createNetwork('facebook', 1)]);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector(
        '.social-row-action.delete',
      ) as HTMLButtonElement).click();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector(
        '.social-delete-button',
      ) as HTMLButtonElement).click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(socialNetworkService.deleteSocialNetwork).toHaveBeenCalledOnceWith(
        SOCIAL_NETWORK_CATALOG_ID,
        'facebook',
      );
      expect(fixture.componentInstance.networks).toEqual([]);
    });

    it('Inés puede seleccionar y editar WhatsApp', async () => {
      await loadNetworks([createNetwork('whatsapp', 1)]);
      fixture.detectChanges();
      const edit = fixture.nativeElement.querySelector(
        '.social-row-action.edit',
      ) as HTMLButtonElement;

      expect(edit.disabled).toBeFalse();
      edit.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.modalOpen).toBeTrue();
      expect(
        Array.from(
          fixture.nativeElement.querySelectorAll(
            '.social-input-group select option',
          ) as NodeListOf<HTMLOptionElement>,
        ).map(({ value }) => value),
      ).toContain('whatsapp');
    });

    it('Julia busca un enlace y luego cambia a todas las redes', async () => {
      await loadNetworks([
        {
          ...createNetwork('instagram', 1),
          url: 'https://instagram.com/julia.flores',
        },
        createNetwork('facebook', 2),
      ]);
      fixture.detectChanges();
      const search = fixture.nativeElement.querySelector(
        '.social-search-field input',
      ) as HTMLInputElement;
      search.value = 'julia.flores';
      search.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(fixture.componentInstance.filteredNetworks.map(({ network }) => network))
        .toEqual(['instagram']);

      search.value = '';
      search.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(fixture.componentInstance.filteredNetworks).toHaveSize(2);
    });
  });
});
