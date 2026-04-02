import type { Principal } from "@icp-sdk/core/principal";
import type { CreateActorOptions, ExternalBlob } from "./backend";

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

declare module "./backend" {
  interface backendInterface {
    createDonation(
      donorName: string,
      medicineName: string,
      quantity: bigint,
      expiryDate: string,
      notes: string,
    ): Promise<bigint>;
    getDonations(): Promise<Donation[]>;
    updateDonation(
      id: bigint,
      donorName: string,
      medicineName: string,
      quantity: bigint,
      expiryDate: string,
      notes: string,
    ): Promise<boolean>;
    updateStatus(id: bigint, status: DonationStatus): Promise<boolean>;
    deleteDonation(id: bigint): Promise<boolean>;
    getStats(): Promise<DonationStats>;
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  }

  function createActor(
    canisterId: string,
    uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
    downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
    options?: CreateActorOptions,
  ): backendInterface;
}
