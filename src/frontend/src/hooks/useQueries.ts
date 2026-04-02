import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  backendInterface as BackendAPI,
  DonationStatus,
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

export function useCreateDonation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      donorName: string;
      medicineName: string;
      quantity: number;
      expiryDate: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).createDonation(
        data.donorName,
        data.medicineName,
        BigInt(data.quantity),
        data.expiryDate,
        data.notes,
      );
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
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return getApi(actor).updateDonation(
        data.id,
        data.donorName,
        data.medicineName,
        BigInt(data.quantity),
        data.expiryDate,
        data.notes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
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
