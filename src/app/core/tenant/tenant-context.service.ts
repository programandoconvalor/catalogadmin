import { Injectable, signal } from '@angular/core';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';

import {
  Member,
  MemberRole,
  MemberStatus,
} from '../models/member.model';

import {
  Tenant,
} from '../models/tenant.model';

export interface TenantContext {
  tenantId: string;
  tenant: Tenant;
  member: Member;
}

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {

  /*
   * ============================================
   * STATE
   * ============================================
   */

  private readonly context =
    signal<TenantContext | null>(null);

  private readonly loading =
    signal(false);

  private readonly error =
    signal<string | null>(null);


  /*
   * ============================================
   * PUBLIC READONLY STATE
   * ============================================
   */

  readonly context$ =
    this.context.asReadonly();

  readonly loading$ =
    this.loading.asReadonly();

  readonly error$ =
    this.error.asReadonly();


  /*
   * ============================================
   * LOAD TENANT CONTEXT
   * ============================================
   *
   * UID
   *  ↓
   * userTenants/{uid}
   *  ↓
   * tenantId
   *  ↓
   * tenants/{tenantId}
   *  ↓
   * members/{uid}
   */

  async loadByUid(
    uid: string
  ): Promise<TenantContext | null> {

    this.loading.set(true);
    this.error.set(null);

    try {

      /*
       * ========================================
       * 1. VALIDAR UID
       * ========================================
       */

      if (!uid.trim()) {

        console.error(
          '[TenantContext] UID inválido.'
        );

        this.error.set(
          'No se pudo identificar al usuario.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 2. BUSCAR USER TENANT
       * ========================================
       */

      const userTenantRef =
        doc(
          db,
          'userTenants',
          uid
        );

      const userTenantSnapshot =
        await getDoc(userTenantRef);

      if (
        !userTenantSnapshot.exists()
      ) {

        console.warn(
          '[TenantContext] No existe userTenants para el UID:',
          uid
        );

        this.error.set(
          'El usuario no está asociado a ninguna cuenta de florería.'
        );

        this.context.set(null);

        return null;
      }

      const userTenantData =
        userTenantSnapshot.data();


      /*
       * ========================================
       * 3. OBTENER DATOS DEL USER TENANT
       * ========================================
       */

      const tenantId =
        userTenantData['tenantId'] as
          | string
          | undefined;

      const role =
        userTenantData['role'] as
          | MemberRole
          | undefined;

      const status =
        userTenantData['status'] as
          | MemberStatus
          | undefined;


      /*
       * ========================================
       * 4. VALIDAR TENANT ID
       * ========================================
       */

      if (!tenantId?.trim()) {

        console.error(
          '[TenantContext] userTenants no contiene tenantId.'
        );

        this.error.set(
          'La configuración de tu cuenta no es válida.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 5. VALIDAR STATUS
       * ========================================
       */

      if (status !== 'active') {

        console.warn(
          '[TenantContext] Membership inactivo:',
          uid
        );

        this.error.set(
          'Tu acceso a esta cuenta se encuentra inactivo.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 6. VALIDAR ROLE
       * ========================================
       */

      const validRoles: MemberRole[] = [
        'owner',
        'admin',
        'editor',
        'viewer',
      ];

      if (
        !role ||
        !validRoles.includes(role)
      ) {

        console.error(
          '[TenantContext] Role inválido:',
          role
        );

        this.error.set(
          'La configuración de permisos de tu cuenta no es válida.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 7. BUSCAR TENANT
       * ========================================
       */

      const tenantRef =
        doc(
          db,
          'tenants',
          tenantId
        );

      const tenantSnapshot =
        await getDoc(tenantRef);

      if (
        !tenantSnapshot.exists()
      ) {

        console.error(
          '[TenantContext] No existe el tenant:',
          tenantId
        );

        this.error.set(
          'No se encontró la cuenta de florería asociada.'
        );

        this.context.set(null);

        return null;
      }

      const tenantData =
        tenantSnapshot.data();


      /*
       * ========================================
       * 8. CREAR TENANT
       * ========================================
       */

      const tenant: Tenant = {

        id: tenantId,

        name:
          tenantData['name'] ?? '',

        slug:
          tenantData['slug'] ?? '',

        logoUrl:
          tenantData['logoUrl'] ?? undefined,

        status:
          tenantData['status'] === 'active'
            ? 'active'
            : 'inactive',

        planId:
          tenantData['planId'],

        subscriptionStatus:
          tenantData['subscriptionStatus'],

        billingPeriod:
          tenantData['billingPeriod'],

        createdAt:
          tenantData['createdAt'],

        updatedAt:
          tenantData['updatedAt'],
      };


      /*
       * ========================================
       * 9. VALIDAR ESTADO DEL TENANT
       * ========================================
       */

      if (
        tenant.status !== 'active'
      ) {

        console.warn(
          '[TenantContext] Tenant inactivo:',
          tenantId
        );

        this.error.set(
          'La cuenta de la florería se encuentra inactiva.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 10. BUSCAR MEMBERSHIP
       * ========================================
       */

      const memberRef =
        doc(
          db,
          'tenants',
          tenantId,
          'members',
          uid
        );

      const memberSnapshot =
        await getDoc(memberRef);

      if (
        !memberSnapshot.exists()
      ) {

        console.error(
          '[TenantContext] No existe membership:',
          {
            tenantId,
            uid,
          }
        );

        this.error.set(
          'Tu usuario no tiene permisos dentro de esta cuenta.'
        );

        this.context.set(null);

        return null;
      }

      const memberData =
        memberSnapshot.data();


      /*
       * ========================================
       * 12. CREAR MEMBER
       * ========================================
       */

      const member: Member = {

        uid:
          memberData['uid'] ?? uid,

        email:
          memberData['email'] ?? '',

        role:
          memberData['role'] as MemberRole,

        status:
          memberData['status'] as MemberStatus,

        createdAt:
          memberData['createdAt'],

        updatedAt:
          memberData['updatedAt'],
      };


      /*
       * ========================================
       * 13. VALIDAR MEMBERSHIP
       * ========================================
       */

      if (
        member.status !== 'active'
      ) {

        console.warn(
          '[TenantContext] Membership inactivo:',
          {
            tenantId,
            uid,
          }
        );

        this.error.set(
          'Tu usuario se encuentra inactivo.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 14. VALIDAR ROLE DEL MEMBERSHIP
       * ========================================
       */

      if (
        !validRoles.includes(
          member.role
        )
      ) {

        console.error(
          '[TenantContext] Role inválido en membership:',
          member.role
        );

        this.error.set(
          'La configuración de permisos de tu cuenta no es válida.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 15. VALIDAR COHERENCIA DEL ROLE
       * ========================================
       *
       * userTenants/{uid}
       *        ↓
       *       role
       *
       * tenants/{tenantId}/members/{uid}
       *        ↓
       *       role
       */

      if (
        role !== member.role
      ) {

        console.error(
          '[TenantContext] Inconsistencia de roles.',
          {
            userTenantRole: role,
            memberRole: member.role,
          }
        );

        this.error.set(
          'La configuración de permisos de tu cuenta no es válida.'
        );

        this.context.set(null);

        return null;
      }


      /*
       * ========================================
       * 16. CREAR TENANT CONTEXT
       * ========================================
       */

      const context: TenantContext = {

        tenantId,

        tenant,

        member,
      };


      /*
       * ========================================
       * 17. GUARDAR CONTEXTO
       * ========================================
       */

      this.context.set(
        context
      );


      /*
       * ========================================
       * 18. LOGS
       * ========================================
       */

      console.log(
        '[TenantContext] Tenant encontrado:',
        tenantId
      );

      console.log(
        '[TenantContext] Tenant:',
        tenant.name
      );

      console.log(
        '[TenantContext] Logo:',
        tenant.logoUrl
      );

      console.log(
        '[TenantContext] Role:',
        member.role
      );

      console.log(
        '[TenantContext] Contexto cargado correctamente.'
      );


      return context;

    } catch (error) {

      console.error(
        '[TenantContext] Error cargando contexto:',
        error
      );

      this.error.set(
        'No fue posible cargar la información de tu cuenta.'
      );

      this.context.set(null);

      return null;

    } finally {

      this.loading.set(false);
    }
  }


  /*
   * ============================================
   * CLEAR
   * ============================================
   */

  clear(): void {

    this.context.set(null);

    this.error.set(null);

    this.loading.set(false);

    console.log(
      '[TenantContext] Contexto limpiado.'
    );
  }


  /*
   * ============================================
   * GETTERS
   * ============================================
   */

  get current(): TenantContext | null {
    return this.context();
  }


  get tenantId(): string | null {
    return (
      this.context()?.tenantId ??
      null
    );
  }


  get tenant(): Tenant | null {
    return (
      this.context()?.tenant ??
      null
    );
  }


  get member(): Member | null {
    return (
      this.context()?.member ??
      null
    );
  }


  get role(): MemberRole | null {
    return (
      this.context()?.member.role ??
      null
    );
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