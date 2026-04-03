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

export interface CustodyEvent {
  timestamp: bigint;
  changedBy: Principal;
  oldStatus: DonationStatus;
  newStatus: DonationStatus;
}

export interface Donation {
  id: bigint;
  donorName: string;
  medicineName: string;
  quantity: bigint;
  expiryDate: string;
  batchNumber: string;
  status: DonationStatus;
  notes: string;
  createdAt: bigint;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  creatorPrincipal: Principal;
  custodyLog: CustodyEvent[];
}

export interface DonationStats {
  total: bigint;
  pending: bigint;
  accepted: bigint;
  delivered: bigint;
  rejected: bigint;
  totalDeliveredQuantity: bigint;
}

export interface UserProfile {
  displayName: string;
  phone: string;
  bio: string;
  updatedAt: bigint;
}

export interface LeaderboardEntry {
  donorName: string;
  deliveredQuantity: bigint;
}

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface backendInterface {
  createDonation(
    donorName: string,
    medicineName: string,
    quantity: bigint,
    expiryDate: string,
    batchNumber: string,
    notes: string,
    pickupAddress: string,
    pickupLat: number,
    pickupLng: number
  ): Promise<bigint>;
  seedDonations(): Promise<bigint>;
  seedNeedRequests(): Promise<bigint>;
  getDonations(): Promise<Donation[]>;
  getDonation(id: bigint): Promise<Option<Donation>>;
  getUserDonations(user: Principal): Promise<Donation[]>;
  getCustodyLog(id: bigint): Promise<CustodyEvent[]>;
  updateDonation(
    id: bigint,
    donorName: string,
    medicineName: string,
    quantity: bigint,
    expiryDate: string,
    batchNumber: string,
    notes: string,
    pickupAddress: string,
    pickupLat: number,
    pickupLng: number
  ): Promise<boolean>;
  setDonationLocation(
    id: bigint,
    address: string,
    lat: number,
    lng: number
  ): Promise<boolean>;
  updateStatus(id: bigint, status: DonationStatus): Promise<boolean>;
  batchUpdateStatus(ids: bigint[], status: DonationStatus): Promise<bigint>;
  deleteDonation(id: bigint): Promise<boolean>;
  getStats(): Promise<DonationStats>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  // User profiles
  setMyProfile(displayName: string, phone: string, bio: string): Promise<void>;
  getMyProfile(): Promise<Option<UserProfile>>;
  getProfile(user: Principal): Promise<Option<UserProfile>>;
  getAllProfiles(): Promise<[Principal, UserProfile][]>;
  // Authorization
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  isCallerAdmin(): Promise<boolean>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
}
