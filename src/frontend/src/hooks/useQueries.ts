import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  backendInterface as BackendAPI,
  DonationStatus,
  UserRole,
} from "../backend.d";
import { useActor } from "./useActor";

function getApi(actor: unknown): BackendAPI {
  return actor as BackendAPI;
}

export function useDonations() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      if (!actor) return [];
      return getApi(actor).getDonations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor) return null;
      return getApi(actor).getStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return getApi(actor).getLeaderboard();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useCustodyLog(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["custodyLog", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return [];
      return getApi(actor).getCustodyLog(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return null;
      return getApi(actor).getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return getApi(actor).getMyProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return getApi(actor).getAllProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserDonations(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userDonations", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return getApi(actor).getUserDonations(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useSetMyProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      displayName: string;
      phone: string;
      bio: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).setMyProfile(data.displayName, data.phone, data.bio);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProfile"] });
      qc.invalidateQueries({ queryKey: ["allProfiles"] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { principal: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).assignCallerUserRole(data.principal, data.role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allProfiles"] });
    },
  });
}

export function useCreateDonation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      donorName: string;
      medicineName: string;
      quantity: number;
      expiryDate: string;
      batchNumber?: string;
      notes: string;
      pickupAddress?: string;
      pickupLat?: number;
      pickupLng?: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).createDonation(
        data.donorName,
        data.medicineName,
        BigInt(data.quantity),
        data.expiryDate,
        data.batchNumber ?? "",
        data.notes,
        data.pickupAddress ?? "",
        data.pickupLat ?? 0,
        data.pickupLng ?? 0,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useSeedDonations() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).seedDonations();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useSeedNeedRequests() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).seedNeedRequests();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateDonation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      donorName: string;
      medicineName: string;
      quantity: number;
      expiryDate: string;
      batchNumber?: string;
      notes: string;
      pickupAddress?: string;
      pickupLat?: number;
      pickupLng?: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).updateDonation(
        data.id,
        data.donorName,
        data.medicineName,
        BigInt(data.quantity),
        data.expiryDate,
        data.batchNumber ?? "",
        data.notes,
        data.pickupAddress ?? "",
        data.pickupLat ?? 0,
        data.pickupLng ?? 0,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useSetDonationLocation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      address: string;
      lat: number;
      lng: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).setDonationLocation(
        data.id,
        data.address,
        data.lat,
        data.lng,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
    },
  });
}

export function useUpdateStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; status: DonationStatus }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).updateStatus(data.id, data.status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["custodyLog"] });
    },
  });
}

export function useBatchUpdateStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ids: bigint[]; status: DonationStatus }) => {
      if (!actor) throw new Error("Not connected");
      // Enforce 50-item cap on the frontend too
      const ids = data.ids.slice(0, 50);
      return getApi(actor).batchUpdateStatus(ids, data.status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["custodyLog"] });
    },
  });
}

export function useDeleteDonation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).deleteDonation(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
