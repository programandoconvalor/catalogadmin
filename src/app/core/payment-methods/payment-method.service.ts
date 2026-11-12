import { Injectable, effect, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { TenantContextService } from '../tenant/tenant-context.service';
import {
  ManagedPaymentMethod,
  PAYMENT_METHODS,
  PaymentMethodId,
  PaymentMethodStatus,
  StorePaymentMethod,
} from '../models/payment-method.model';

const MAX_PAYMENT_METHODS = 10;

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly tenantContext = inject(TenantContextService);
  private activeTenantId: string | null = null;
  private cache: ManagedPaymentMethod[] | null = null;
  private cacheExpiresAt = 0;

  constructor() {
    effect(() => {
      const tenantId = this.tenantContext.tenantId;
      if (tenantId !== this.activeTenantId) {
        this.activeTenantId = tenantId;
        this.cache = null;
        this.cacheExpiresAt = 0;
      }
    });
  }

  async getPaymentMethods(force = false): Promise<ManagedPaymentMethod[]> {
    const tenantId = this.requireTenantId();
    if (!force && this.cache && this.cacheExpiresAt > Date.now()) {
      return this.clone(this.cache);
    }

    const snapshot = await getDocsFromServer(
      query(collection(db, 'tenants', tenantId, 'paymentMethods'), orderBy('sortOrder', 'asc')),
    );

    const methods = snapshot.docs.map((item) => {
      const data = item.data();
      const type = data['type'] as PaymentMethodId;
      const definition = PAYMENT_METHODS.find((method) => method.id === type);

      if (!definition || typeof data['name'] !== 'string') {
        throw new Error(`El método de pago "${item.id}" tiene información inválida.`);
      }

      const isActive = data['isActive'] !== false;
      const sortOrder = Number(data['sortOrder'] ?? 0);
      if (!Number.isSafeInteger(sortOrder) || sortOrder < 1) {
        throw new Error(`El orden del método "${data['name']}" no es válido.`);
      }

      return {
        id: item.id,
        name: data['name'].trim(),
        type,
        isActive,
        status: isActive ? 'active' : 'inactive',
        sortOrder,
        createdAt: data['createdAt'],
        updatedAt: data['updatedAt'],
      } satisfies ManagedPaymentMethod;
    });

    if (methods.length > MAX_PAYMENT_METHODS) {
      throw new Error('La colección supera el máximo de 10 métodos de pago.');
    }

    const types = new Set<PaymentMethodId>();
    const orders = new Set<number>();
    for (const method of methods) {
      if (types.has(method.type)) throw new Error(`${this.label(method.type)} está duplicado.`);
      if (orders.has(method.sortOrder)) throw new Error(`El orden ${method.sortOrder} está duplicado.`);
      types.add(method.type);
      orders.add(method.sortOrder);
    }

    this.cache = methods;
    this.cacheExpiresAt = Date.now() + 15000;
    return this.clone(methods);
  }

  async createPaymentMethod(input: StorePaymentMethod): Promise<void> {
    this.validate(input);
    const tenantId = this.requireTenantId();
    const current = await this.getPaymentMethods(true);
    if (current.length >= MAX_PAYMENT_METHODS) throw new Error('Solo puedes configurar hasta 10 métodos de pago.');
    if (current.some((item) => item.type === input.type)) throw new Error(`${this.label(input.type)} ya está configurado.`);
    this.assertOrder(current, input.sortOrder);

    await addDoc(collection(db, 'tenants', tenantId, 'paymentMethods'), {
      name: input.name.trim(),
      type: input.type,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    this.invalidate();
  }

  async updatePaymentMethod(id: string, input: StorePaymentMethod): Promise<void> {
    this.validate(input);
    const tenantId = this.requireTenantId();
    const current = await this.getPaymentMethods(true);
    if (!current.some((item) => item.id === id)) throw new Error('El método de pago ya no existe.');
    if (current.some((item) => item.id !== id && item.type === input.type)) {
      throw new Error(`${this.label(input.type)} ya está configurado.`);
    }
    this.assertOrder(current, input.sortOrder, id);

    await updateDoc(doc(db, 'tenants', tenantId, 'paymentMethods', id), {
      name: input.name.trim(),
      type: input.type,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: serverTimestamp(),
    });
    this.invalidate();
  }

  async deletePaymentMethod(id: string): Promise<void> {
    const tenantId = this.requireTenantId();
    await deleteDoc(doc(db, 'tenants', tenantId, 'paymentMethods', id));
    this.invalidate();
  }

  private validate(input: StorePaymentMethod): void {
    if (!PAYMENT_METHODS.some((item) => item.id === input.type)) throw new Error('Selecciona un método de pago válido.');
    if (!input.name.trim() || input.name.trim().length > 80) throw new Error('El nombre es obligatorio y no puede superar 80 caracteres.');
    if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 1) throw new Error('El orden debe ser un entero mayor o igual a 1.');
    if (typeof input.isActive !== 'boolean') throw new Error('Selecciona un estado válido.');
  }

  private assertOrder(methods: ManagedPaymentMethod[], order: number, excludedId?: string): void {
    if (methods.some((item) => item.id !== excludedId && item.sortOrder === order)) {
      throw new Error(`El orden ${order} ya está asignado a otro método de pago.`);
    }
  }

  private label(type: PaymentMethodId): string {
    return PAYMENT_METHODS.find((item) => item.id === type)?.label ?? type;
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) throw new Error('No se encontró el contexto de la florería. Vuelve a iniciar sesión.');
    return tenantId;
  }

  private invalidate(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }

  private clone(methods: ManagedPaymentMethod[]): ManagedPaymentMethod[] {
    return methods.map((item) => ({ ...item }));
  }
}
