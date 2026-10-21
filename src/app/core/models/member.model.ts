export type MemberRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'viewer';

export type MemberStatus =
  | 'active'
  | 'inactive';

export interface Member {
  uid: string;

  email: string;

  role: MemberRole;

  status: MemberStatus;

  createdAt?: unknown;

  updatedAt?: unknown;
}