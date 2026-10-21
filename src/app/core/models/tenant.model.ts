export type TenantStatus =
  | 'active'
  | 'inactive';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  status: TenantStatus;
  planId?: string;
  subscriptionStatus?: string;
  billingPeriod?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
