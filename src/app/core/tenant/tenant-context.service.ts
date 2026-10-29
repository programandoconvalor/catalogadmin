import { Injectable, signal } from '@angular/core';

import { doc, getDoc } from 'firebase/firestore';

import {
  getDownloadURL,
  listAll,
  ref,
} from 'firebase/storage';

import { db, storage } from '../firebase/firebase';

import {
  Member,
  MemberRole,
  MemberStatus,
} from '../models/member.model';

import { Tenant } from '../models/tenant.model';

export interface TenantContext {
  tenantId: string;
  tenant: Tenant;
  member: Member;
}

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private readonly context = signal<TenantContext | null>(null);
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  readonly context$ = this.context.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  /**
   * Obtiene el logo del tenant.
   *
   * 1. Utiliza logoUrl si ya contiene una URL.
   * 2. Si no existe, busca imágenes en Firebase Storage:
   *    tenants/{tenantId}/logo/images/
   * 3. Si hay varias, intenta utilizar la que tenga el timestamp
   *    más reciente en su nombre (logo-{timestamp}.ext).
   *
   * No modifica Firestore ni las reglas de Storage.
   */
  private async resolveTenantLogoUrl(
  tenantId: string,
  storedLogoUrl: unknown,
): Promise<string | undefined> {
  const logoUrl =
    typeof storedLogoUrl === 'string'
      ? storedLogoUrl.trim()
      : '';

  // Si Firestore ya contiene la URL de descarga, reutilizarla.
  if (/^https?:\/\//i.test(logoUrl)) {
    return logoUrl;
  }

  // Obtener directamente el archivo conocido, sin listar la carpeta.
  const logoPath =
    `tenants/${tenantId}/logo/images/logo-1793306061149.png`;

  try {
    const logoRef = ref(storage, logoPath);
    const downloadUrl = await getDownloadURL(logoRef);

    console.log('[TenantContext] Logo obtenido desde Storage.');

    return downloadUrl;
  } catch (error) {
    console.error(
      '[TenantContext] No fue posible obtener el logo:',
      error,
    );

    return undefined;
  }
}

  async loadByUid(uid: string): Promise<TenantContext | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (!uid.trim()) {
        this.error.set('No se pudo identificar al usuario.');
        this.context.set(null);
        return null;
      }

      // 1. Obtener la asociación del usuario con su tenant.
      const userTenantRef = doc(db, 'userTenants', uid);
      const userTenantSnapshot = await getDoc(userTenantRef);

      if (!userTenantSnapshot.exists()) {
        this.error.set(
          'El usuario no está asociado a ninguna cuenta de florería.',
        );
        this.context.set(null);
        return null;
      }

      const userTenantData = userTenantSnapshot.data();

      const tenantId = userTenantData['tenantId'] as
        | string
        | undefined;

      const role = userTenantData['role'] as
        | MemberRole
        | undefined;

      const status = userTenantData['status'] as
        | MemberStatus
        | undefined;

      if (!tenantId?.trim()) {
        this.error.set(
          'La configuración de tu cuenta no es válida.',
        );
        this.context.set(null);
        return null;
      }

      // 2. Validar el estado de la asociación.
      if (status !== 'active') {
        this.error.set(
          'Tu acceso a esta cuenta se encuentra inactivo.',
        );
        this.context.set(null);
        return null;
      }

      const validRoles: MemberRole[] = [
        'owner',
        'admin',
        'editor',
        'viewer',
      ];

      if (!role || !validRoles.includes(role)) {
        this.error.set(
          'La configuración de permisos de tu cuenta no es válida.',
        );
        this.context.set(null);
        return null;
      }

      // 3. Obtener el documento principal del tenant.
      const tenantRef = doc(db, 'tenants', tenantId);
      const tenantSnapshot = await getDoc(tenantRef);

      if (!tenantSnapshot.exists()) {
        this.error.set(
          'No se encontró la cuenta de florería asociada.',
        );
        this.context.set(null);
        return null;
      }

      const tenantData = tenantSnapshot.data();

      const tenant: Tenant = {
        id: tenantId,
        name: tenantData['name'] ?? '',
        slug: tenantData['slug'] ?? '',

        // Se completa después consultando Storage si hace falta.
        logoUrl:
          typeof tenantData['logoUrl'] === 'string'
            ? tenantData['logoUrl']
            : undefined,

        status:
          tenantData['status'] === 'active'
            ? 'active'
            : 'inactive',

        planId: tenantData['planId'],
        subscriptionStatus: tenantData['subscriptionStatus'],
        billingPeriod: tenantData['billingPeriod'],
        createdAt: tenantData['createdAt'],
        updatedAt: tenantData['updatedAt'],
      };

      if (tenant.status !== 'active') {
        this.error.set(
          'La cuenta de la florería se encuentra inactiva.',
        );
        this.context.set(null);
        return null;
      }

      // 4. Resolver el logo sin bloquear el acceso si falla Storage.
      tenant.logoUrl = await this.resolveTenantLogoUrl(
        tenantId,
        tenant.logoUrl,
      );

      // 5. Obtener el documento de membresía.
      const memberRef = doc(
        db,
        'tenants',
        tenantId,
        'members',
        uid,
      );

      const memberSnapshot = await getDoc(memberRef);

      let member: Member;

      if (!memberSnapshot.exists()) {
        // Compatibilidad con cuentas que todavía no tienen
        // el documento espejo en tenants/{tenantId}/members/{uid}.
        member = {
          uid,
          email:
            (userTenantData['email'] as string | undefined) ?? '',
          role,
          status,
          createdAt: userTenantData['createdAt'],
          updatedAt: userTenantData['updatedAt'],
        };
      } else {
        const memberData = memberSnapshot.data();

        member = {
          uid: (memberData['uid'] as string | undefined) ?? uid,
          email:
            (memberData['email'] as string | undefined) ?? '',
          role: memberData['role'] as MemberRole,
          status: memberData['status'] as MemberStatus,
          createdAt: memberData['createdAt'],
          updatedAt: memberData['updatedAt'],
        };

        if (member.status !== 'active') {
          this.error.set('Tu usuario se encuentra inactivo.');
          this.context.set(null);
          return null;
        }

        if (!validRoles.includes(member.role)) {
          this.error.set(
            'La configuración de permisos de tu cuenta no es válida.',
          );
          this.context.set(null);
          return null;
        }

        if (role !== member.role) {
          this.error.set(
            'La configuración de permisos de tu cuenta no es válida.',
          );
          this.context.set(null);
          return null;
        }
      }

      // 6. Guardar el contexto para los componentes del panel.
      const context: TenantContext = {
        tenantId,
        tenant,
        member,
      };

      this.context.set(context);

      console.log('[TenantContext] Contexto cargado:', {
        tenantId,
        tenantName: tenant.name,
        hasLogo: Boolean(tenant.logoUrl),
        role: member.role,
      });

      return context;
    } catch (error) {
      console.error(
        '[TenantContext] Error cargando contexto:',
        error,
      );

      this.error.set(
        'No fue posible cargar la información de tu cuenta.',
      );

      this.context.set(null);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  clear(): void {
    this.context.set(null);
    this.error.set(null);
    this.loading.set(false);

    console.log('[TenantContext] Contexto limpiado.');
  }

  /**
   * Actualiza la identidad visual del tenant en memoria.
   */
  updateTenantBranding(name: string, logoUrl: string): void {
    this.context.update((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        tenant: {
          ...current.tenant,
          name: name.trim() || current.tenant.name,
          logoUrl: logoUrl.trim() || undefined,
        },
      };
    });
  }

  get current(): TenantContext | null {
    return this.context();
  }

  get tenantId(): string | null {
    return this.context()?.tenantId ?? null;
  }

  get tenant(): Tenant | null {
    return this.context()?.tenant ?? null;
  }

  get member(): Member | null {
    return this.context()?.member ?? null;
  }

  get role(): MemberRole | null {
    return this.context()?.member.role ?? null;
  }

  get isOwner(): boolean {
    return this.role === 'owner';
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isEditor(): boolean {
    return this.role === 'editor';
  }

  get isViewer(): boolean {
    return this.role === 'viewer';
  }

  get isLoading(): boolean {
    return this.loading();
  }

  get hasError(): boolean {
    return this.error() !== null;
  }

  get errorMessage(): string | null {
    return this.error();
  }
}