
import { effect, Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDocsFromServer,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { CatalogId } from '../models/catalog-item.model';
import {
  EditableSocialNetworkId,
  ManagedStoreSocialNetwork,
  SOCIAL_NETWORKS,
  SOCIAL_NETWORK_CATALOG_ID,
  StoreSocialNetworkId,
  StoreSocialNetworkStatus,
} from '../models/social-network.model';
import { TenantContextService } from '../tenant/tenant-context.service';

export type StoreSocialNetworkInput = Pick<
  ManagedStoreSocialNetwork,
  'url' | 'sortOrder' | 'status'
> & { network: EditableSocialNetworkId };

const MAX_SOCIAL_NETWORKS = 5;
const CACHE_TTL_MS = 15_000;

const SOCIAL_NETWORK_HOSTS: Record<StoreSocialNetworkId, readonly string[]> = {
  facebook: ['facebook.com'],
  instagram: ['instagram.com'],
  whatsapp: ['wa.me', 'whatsapp.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
};

const isSocialNetworkId = (
  value: unknown,
): value is StoreSocialNetworkId =>
  SOCIAL_NETWORKS.some((network) => network.id === value);

const isSocialDocumentId = (value: unknown): value is string =>
  value === 'socials' || isSocialNetworkId(value);

const isSocialNetworkStatus = (
  value: unknown,
): value is StoreSocialNetworkStatus =>
  value === 'active' || value === 'inactive';

export function getSocialNetworkUrlError(
  network: StoreSocialNetworkId,
  rawUrl: string,
): string | null {
  const value = rawUrl.trim();

  if (!value) {
    return 'La URL del perfil es obligatoria.';
  }

  if (value.length > 2048) {
    return 'La URL no puede superar 2048 caracteres.';
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return 'Ingresa una URL completa y válida.';
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return 'La URL debe comenzar con http:// o https://.';
  }

  if (url.username || url.password || url.port) {
    return 'La URL no debe incluir credenciales ni puertos personalizados.';
  }

  const hostname = url.hostname.toLocaleLowerCase();

  const matchesDomain = SOCIAL_NETWORK_HOSTS[network].some(
    (domain) =>
      hostname === domain || hostname.endsWith(`.${domain}`),
  );

  return matchesDomain
    ? null
    : `La URL debe pertenecer a ${
        SOCIAL_NETWORKS.find(({ id }) => id === network)?.label ?? network
      }.`;
}

@Injectable({ providedIn: 'root' })
export class SocialNetworkService {
  private readonly tenantContext = inject(TenantContextService);

  private readonly cache = new Map<
    string,
    { data: ManagedStoreSocialNetwork[]; expiresAt: number }
  >();

  private readonly pendingRequests = new Map<
    string,
    Promise<ManagedStoreSocialNetwork[]>
  >();

  private activeTenantId: string | null = null;
  private cacheGeneration = 0;

  private readonly socialDocumentIds: string[] = [
    ...SOCIAL_NETWORKS.map(({ id }) => id),
    'socials',
  ];

  constructor() {
    effect(() => {
      const tenantId = this.tenantContext.tenantId;

      if (tenantId !== this.activeTenantId) {
        this.cache.clear();
        this.pendingRequests.clear();
        this.cacheGeneration += 1;
        this.activeTenantId = tenantId;
      }
    });
  }

  async getSocialNetworks(
    catalogId: CatalogId,
  ): Promise<ManagedStoreSocialNetwork[]> {
    this.validateCatalogId(catalogId);

    const tenantId = this.requireTenantId();

    this.activateTenant(tenantId);

    const cacheKey = this.getCacheKey(tenantId, catalogId);

    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return this.cloneNetworks(cached.data);
    }

    const pending = this.pendingRequests.get(cacheKey);

    if (pending) {
      return this.cloneNetworks(await pending);
    }

    const generation = this.cacheGeneration;

    const request = this.fetchSocialNetworks(
      tenantId,
      catalogId,
      cacheKey,
      generation,
    );

    this.pendingRequests.set(cacheKey, request);

    try {
      return this.cloneNetworks(await request);
    } finally {
      if (this.pendingRequests.get(cacheKey) === request) {
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  async getActiveSocialNetworks(
    catalogId: CatalogId,
  ): Promise<ManagedStoreSocialNetwork[]> {
    const networks = await this.getSocialNetworks(catalogId);

    return networks.filter(
      (network) => network.status === 'active',
    );
  }

  async createSocialNetwork(
    catalogId: CatalogId,
    input: StoreSocialNetworkInput,
  ): Promise<void> {
    this.validateCatalogId(catalogId);
    this.validateInput(input);

    const tenantId = this.requireTenantId();

    try {
      await runTransaction(db, async (transaction) => {
        // Las lecturas de una transacción se realizan secuencialmente.
        const snapshots = [];

        for (const id of this.socialDocumentIds) {
          const reference = this.networkRef(tenantId, id);
          const snapshot = await transaction.get(reference);

          snapshots.push(snapshot);
        }

        const existing = this.normalizeSnapshot(
          snapshots.filter((snapshot) => snapshot.exists()),
          catalogId,
        );

        if (existing.length >= MAX_SOCIAL_NETWORKS) {
          throw new Error(
            'Solo puedes configurar hasta 5 redes sociales.',
          );
        }

        if (
          existing.some(
            ({ network }) => network === input.network,
          )
        ) {
          throw new Error(
            `${this.getNetworkLabel(input.network)} ya está configurada.`,
          );
        }

        this.assertOrderAvailable(existing, input.sortOrder);

        const targetRef = this.networkRef(
          tenantId,
          input.network,
        );

        transaction.set(targetRef, {
          catalogId,
          ...input,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      this.invalidateCache(tenantId);
    } catch (error) {
      console.error(
        '[SocialNetworkService] Error creando red social:',
        error,
      );

      throw error;
    }
  }

  async updateSocialNetwork(
    catalogId: CatalogId,
    socialId: string,
    input: StoreSocialNetworkInput,
  ): Promise<void> {
    this.validateCatalogId(catalogId);
    this.validateInput(input);

    const tenantId = this.requireTenantId();

    if (!isSocialDocumentId(socialId)) {
      throw new Error('Selecciona una red social válida.');
    }

    try {
      await runTransaction(db, async (transaction) => {
        const originalRef = this.networkRef(
          tenantId,
          socialId,
        );

        const targetRef = this.networkRef(
          tenantId,
          input.network,
        );

        // Las lecturas se hacen una por una antes de cualquier escritura.
        const snapshots = [];

        for (const id of this.socialDocumentIds) {
          const reference = this.networkRef(tenantId, id);
          const snapshot = await transaction.get(reference);

          snapshots.push(snapshot);
        }

        const currentSnapshot = snapshots.find(
          (snapshot) => snapshot.id === socialId,
        );

        if (!currentSnapshot?.exists()) {
          throw new Error(
            'La red social que intentas editar ya no existe.',
          );
        }

        if (
          currentSnapshot.data()['catalogId'] !== catalogId
        ) {
          throw new Error(
            'La red social no pertenece al catálogo actual.',
          );
        }

        const existing = this.normalizeSnapshot(
          snapshots.filter((snapshot) => snapshot.exists()),
          catalogId,
        );

        if (
          existing.some(
            (item) =>
              item.network === input.network &&
              item.id !== socialId,
          )
        ) {
          throw new Error(
            `${this.getNetworkLabel(input.network)} ya está configurada.`,
          );
        }

        this.assertOrderAvailable(
          existing,
          input.sortOrder,
          socialId,
        );

        const currentNetwork = currentSnapshot.data()['network'];

        // Si el documento tiene el ID legacy "socials",
        // se conserva para no romper la compatibilidad.
        if (
          socialId !== 'socials' &&
          input.network !== currentNetwork
        ) {
          transaction.delete(originalRef);

          transaction.set(targetRef, {
            catalogId,
            ...input,
            createdAt:
              currentSnapshot.data()['createdAt'] ??
              serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          transaction.update(originalRef, {
            catalogId,
            ...input,
            updatedAt: serverTimestamp(),
          });
        }
      });

      this.invalidateCache(tenantId);
    } catch (error) {
      console.error(
        '[SocialNetworkService] Error actualizando red social:',
        error,
      );

      throw error;
    }
  }

  async deleteSocialNetwork(
    catalogId: CatalogId,
    socialId: string,
  ): Promise<void> {
    this.validateCatalogId(catalogId);

    if (!isSocialDocumentId(socialId)) {
      throw new Error('Selecciona una red social válida.');
    }

    const tenantId = this.requireTenantId();

    try {
      await runTransaction(db, async (transaction) => {
        const networkRef = this.networkRef(
          tenantId,
          socialId,
        );

        const snapshot = await transaction.get(networkRef);

        if (!snapshot.exists()) {
          throw new Error(
            'La red social que intentas eliminar ya no existe.',
          );
        }

        this.normalizeSnapshot([snapshot], catalogId);

        transaction.delete(networkRef);
      });

      this.invalidateCache(tenantId);
    } catch (error) {
      console.error(
        '[SocialNetworkService] Error eliminando red social:',
        error,
      );

      throw error;
    }
  }

  private validateInput(
    input: StoreSocialNetworkInput,
  ): void {
    if (!isEditableSocialNetworkId(input.network)) {
      throw new Error('Selecciona una red social válida.');
    }

    if (
      !Number.isSafeInteger(input.sortOrder) ||
      input.sortOrder < 1
    ) {
      throw new Error(
        'El orden debe ser un entero mayor o igual a 1.',
      );
    }

    if (!isSocialNetworkStatus(input.status)) {
      throw new Error('Selecciona un estado válido.');
    }

    const urlError = getSocialNetworkUrlError(
      input.network,
      input.url,
    );

    if (urlError) {
      throw new Error(urlError);
    }
  }

  private assertOrderAvailable(
    socials: readonly ManagedStoreSocialNetwork[],
    sortOrder: number,
    excludedSocialId?: string,
  ): void {
    if (
      socials.some(
        (social) =>
          social.id !== excludedSocialId &&
          social.sortOrder === sortOrder,
      )
    ) {
      throw new Error(
        `El orden ${sortOrder} ya está asignado a otra red social.`,
      );
    }
  }

  private getNetworkLabel(
    network: StoreSocialNetworkId,
  ): string {
    return (
      SOCIAL_NETWORKS.find(
        (item) => item.id === network,
      )?.label ?? network
    );
  }

  private async fetchSocialNetworks(
    tenantId: string,
    catalogId: CatalogId,
    cacheKey: string,
    generation: number,
  ): Promise<ManagedStoreSocialNetwork[]> {
    try {
      const snapshot = await getDocsFromServer(
        this.networksQuery(tenantId, catalogId),
      );

      const networks = this.normalizeSnapshot(
        snapshot.docs,
        catalogId,
      );

      if (
        this.tenantContext.tenantId === tenantId &&
        this.cacheGeneration === generation
      ) {
        this.cache.set(cacheKey, {
          data: networks,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }

      return networks;
    } catch (error) {
      console.error(
        '[SocialNetworkService] Error al consultar redes sociales:',
        error,
      );

      throw error;
    }
  }

  private normalizeSnapshot(
    documents: readonly {
      id: string;
      data(): DocumentData | undefined;
    }[],
    catalogId: CatalogId,
  ): ManagedStoreSocialNetwork[] {
    if (documents.length > MAX_SOCIAL_NETWORKS) {
      throw new Error(
        'La configuración supera el límite de cinco redes sociales.',
      );
    }

    const networks = documents.map((document) => {
      const { id } = document;
      const value = document.data();

      if (!value) {
        throw new Error(
          `El documento de red social "${id}" está vacío.`,
        );
      }

      if (value['catalogId'] !== catalogId) {
        throw new Error(
          `El documento de red social "${id}" pertenece a otro catálogo.`,
        );
      }

      const network = value['network'];
      const url = value['url'];
      const sortOrder = value['sortOrder'];
      const status = value['status'];

      if (
        !isSocialNetworkId(network) ||
        (id !== network && id !== 'socials')
      ) {
        throw new Error(
          `El identificador de red social "${id}" no es válido.`,
        );
      }

      if (
        typeof url !== 'string' ||
        getSocialNetworkUrlError(network, url)
      ) {
        throw new Error(
          `La URL de ${this.getNetworkLabel(network)} no es válida.`,
        );
      }

      if (
        !Number.isSafeInteger(sortOrder) ||
        Number(sortOrder) < 1
      ) {
        throw new Error(
          `El orden de ${this.getNetworkLabel(network)} no es válido.`,
        );
      }

      if (!isSocialNetworkStatus(status)) {
        throw new Error(
          `El estado de ${this.getNetworkLabel(network)} no es válido.`,
        );
      }

      return {
        id,
        catalogId,
        network,
        url: url.trim(),
        sortOrder: Number(sortOrder),
        status,
        createdAt: value['createdAt'],
        updatedAt: value['updatedAt'],
      } satisfies ManagedStoreSocialNetwork;
    });

    const usedOrders = new Set<number>();
    const usedNetworks = new Set<StoreSocialNetworkId>();

    for (const network of networks) {
      if (usedNetworks.has(network.network)) {
        throw new Error(
          `La red ${this.getNetworkLabel(network.network)} está duplicada.`,
        );
      }

      usedNetworks.add(network.network);

      if (usedOrders.has(network.sortOrder)) {
        throw new Error(
          `El orden ${network.sortOrder} está duplicado.`,
        );
      }

      usedOrders.add(network.sortOrder);
    }

    return networks.sort(this.compareOrder);
  }

  private networksQuery(
    tenantId: string,
    catalogId: CatalogId,
  ) {
    return query(
      collection(db, 'tenants', tenantId, 'socials'),
      where('catalogId', '==', catalogId),
      limit(MAX_SOCIAL_NETWORKS + 1),
    );
  }

  private networkRef(
    tenantId: string,
    socialId: string,
  ) {
    return doc(
      db,
      'tenants',
      tenantId,
      'socials',
      socialId,
    );
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;

    if (
      typeof tenantId !== 'string' ||
      !tenantId.trim()
    ) {
      throw new Error(
        'No hay un tenant activo para administrar las redes sociales.',
      );
    }

    return tenantId;
  }

  private validateCatalogId(
    catalogId: CatalogId,
  ): void {
    if (catalogId !== SOCIAL_NETWORK_CATALOG_ID) {
      throw new Error(
        'El catálogo de redes sociales no es válido.',
      );
    }
  }

  private getCacheKey(
    tenantId: string,
    catalogId: CatalogId,
  ): string {
    return `${tenantId}:${catalogId}`;
  }

  private activateTenant(
    tenantId: string,
  ): void {
    if (tenantId === this.activeTenantId) {
      return;
    }

    this.cache.clear();
    this.pendingRequests.clear();
    this.cacheGeneration += 1;
    this.activeTenantId = tenantId;
  }

  private invalidateCache(
    tenantId: string,
  ): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        this.cache.delete(key);
      }
    }

    this.cacheGeneration += 1;

    for (const key of this.pendingRequests.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  private cloneNetworks(
    networks: readonly ManagedStoreSocialNetwork[],
  ): ManagedStoreSocialNetwork[] {
    return networks.map((network) => ({ ...network }));
  }

  private readonly compareOrder = (
    first: ManagedStoreSocialNetwork,
    second: ManagedStoreSocialNetwork,
  ): number => first.sortOrder - second.sortOrder;
}

const isEditableSocialNetworkId = (
  value: unknown,
): value is EditableSocialNetworkId =>
  isSocialNetworkId(value);
