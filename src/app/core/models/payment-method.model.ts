export type PaymentMethodId =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'paypal'
  | 'mercado-pago'
  | 'oxxo'
  | 'spei'
  | 'cash'
  | 'deposit'
  | 'transfer';

export type PaymentMethodStatus = 'active' | 'inactive';

export interface StorePaymentMethod {
  name: string;
  type: PaymentMethodId;
  isActive: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ManagedPaymentMethod extends StorePaymentMethod {
  id: string;
  status: PaymentMethodStatus;
}

export const PAYMENT_METHODS: Array<{
  id: PaymentMethodId;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}> = [
  { id: 'visa', label: 'Visa', shortLabel: 'VISA', description: 'Tarjeta Visa', color: '#1A1F71' },
  { id: 'mastercard', label: 'Mastercard', shortLabel: '● ●', description: 'Tarjeta Mastercard', color: '#EB001B' },
  { id: 'amex', label: 'American Express', shortLabel: 'AMEX', description: 'Tarjeta American Express', color: '#2E77BC' },
  { id: 'paypal', label: 'PayPal', shortLabel: 'PayPal', description: 'Pago con PayPal', color: '#003087' },
  { id: 'mercado-pago', label: 'Mercado Pago', shortLabel: 'mercado pago', description: 'Pago con Mercado Pago', color: '#009EE3' },
  { id: 'oxxo', label: 'OXXO', shortLabel: 'OXXO', description: 'Pago en tiendas OXXO', color: '#D71920' },
  { id: 'spei', label: 'SPEI', shortLabel: 'SPEI', description: 'Transferencia interbancaria SPEI', color: '#5A3E9B' },
  { id: 'cash', label: 'Efectivo', shortLabel: '$', description: 'Pago en efectivo', color: '#16A36A' },
  { id: 'deposit', label: 'Depósitos', shortLabel: 'DEPÓSITO', description: 'Depósito bancario', color: '#64748B' },
  { id: 'transfer', label: 'Transferencias', shortLabel: 'TRANSFERENCIA', description: 'Transferencia bancaria', color: '#64748B' },
];
