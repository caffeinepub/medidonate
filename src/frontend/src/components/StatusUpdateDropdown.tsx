import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { DonationStatus } from "../backend.d";
import { useUpdateStatus } from "../hooks/useQueries";
import { StatusBadge, getStatusKey } from "./StatusBadge";

const allStatuses: DonationStatus[] = [
  { pending: null },
  { accepted: null },
  { delivered: null },
  { rejected: null },
];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  delivered: "Delivered",
  rejected: "Rejected",
};

export function StatusUpdateDropdown({
  id,
  status,
}: {
  id: bigint;
  status: DonationStatus;
}) {
  const mutation = useUpdateStatus();
  const currentKey = getStatusKey(status);

  const handleUpdate = async (newStatus: DonationStatus) => {
    const key = getStatusKey(newStatus);
    if (key === currentKey) return;
    try {
      await mutation.mutateAsync({ id, status: newStatus });
      toast.success(`Status updated to ${statusLabels[key]}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="cursor-pointer focus:outline-none"
          data-ocid="donation.dropdown_menu"
        >
          <StatusBadge status={status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {allStatuses.map((s) => {
          const key = getStatusKey(s);
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleUpdate(s)}
              className={key === currentKey ? "font-semibold" : ""}
            >
              <StatusBadge status={s} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
