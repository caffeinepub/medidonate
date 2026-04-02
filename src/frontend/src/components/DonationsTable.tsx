import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Donation, UserRole } from "../backend.d";
import { useDeleteDonation } from "../hooks/useQueries";
import { StatusBadge } from "./StatusBadge";
import { StatusUpdateDropdown } from "./StatusUpdateDropdown";

type FilterStatus = "all" | "pending" | "accepted" | "delivered" | "rejected";

interface DonationsTableProps {
  donations: Donation[];
  isLoading: boolean;
  role?: UserRole | null;
  onEdit: (donation: Donation) => void;
  filterStatus: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
}

const filters: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Delivered", value: "delivered" },
  { label: "Rejected", value: "rejected" },
];

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];
const SKELETON_CELLS = ["c1", "c2", "c3", "c4", "c5", "c6"];

function DeleteButton({ id }: { id: bigint }) {
  const mutation = useDeleteDonation();
  const handleDelete = async () => {
    try {
      await mutation.mutateAsync(id);
      toast.success("Donation deleted");
    } catch {
      toast.error("Failed to delete donation");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          data-ocid="donation.delete_button"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-ocid="donation.dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Donation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this donation? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-ocid="donation.cancel_button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-ocid="donation.confirm_button"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DonationsTable({
  donations,
  isLoading,
  role,
  onEdit,
  filterStatus,
  onFilterChange,
}: DonationsTableProps) {
  const isAdmin = role ? "admin" in role : false;

  const filtered =
    filterStatus === "all"
      ? donations
      : donations.filter((d) => Object.keys(d.status)[0] === filterStatus);

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap" data-ocid="donations.filter.tab">
        {filters.map((f) => (
          <button
            type="button"
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            data-ocid="donations.tab"
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-lg border border-border/60 overflow-hidden bg-card shadow-card"
        data-ocid="donations.table"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">
                Medicine
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Donor
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Quantity
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Expiry Date
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKELETON_ROWS.map((rowId) => (
                <TableRow key={rowId}>
                  {SKELETON_CELLS.map((cellId) => (
                    <TableCell key={cellId}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="donations.empty_state"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <p className="font-medium">No donations found</p>
                    <p className="text-sm">
                      Create a new donation to get started
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((donation, idx) => (
                <TableRow
                  key={donation.id.toString()}
                  data-ocid={`donations.row.item.${idx + 1}`}
                >
                  <TableCell className="font-medium">
                    {donation.medicineName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {donation.donorName}
                  </TableCell>
                  <TableCell>{donation.quantity.toString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {donation.expiryDate}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <StatusUpdateDropdown
                        id={donation.id}
                        status={donation.status}
                      />
                    ) : (
                      <StatusBadge status={donation.status} />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(donation)}
                        data-ocid="donation.edit_button"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {isAdmin && <DeleteButton id={donation.id} />}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
