import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
  __kind__: "Some";
  value: T;
}
export interface None {
  __kind__: "None";
}
export type Option<T> = Some<T> | None;

export type DonationStatus =
  | { pending: null }
  | { accepted: null }
  | { delivered: null }
  | { rejected: null };

export interface Donation {
  id: bigint;
  donorName: string;
  medicineName: string;
  quantity: bigint;
  expiryDate: string;
  status: DonationStatus;
  notes: string;
  createdAt: bigint;
}

export interface DonationStats {
  total: bigint;
  pending: bigint;
  accepted: bigint;
  delivered: bigint;
  rejected: bigint;
}

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface backendInterface {
  createDonation(
    donorName: string,
    medicineName: string,
    quantity: bigint,
    expiryDate: string,
    notes: string
  ): Promise<bigint>;
  getDonations(): Promise<Donation[]>;
  getDonation(id: bigint): Promise<Option<Donation>>;
  updateDonation(
    id: bigint,
    donorName: string,
    medicineName: string,
    quantity: bigint,
    expiryDate: string,
    notes: string
  ): Promise<boolean>;
  updateStatus(id: bigint, status: DonationStatus): Promise<boolean>;
  deleteDonation(id: bigint): Promise<boolean>;
  getStats(): Promise<DonationStats>;
  // Authorization
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  isCallerAdmin(): Promise<boolean>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
}
