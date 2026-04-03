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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  MapPin,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Donation, DonationStatus, UserRole } from "../backend.d";
import { useBatchUpdateStatus, useDeleteDonation } from "../hooks/useQueries";
import { CustodyLogSheet } from "./CustodyLogSheet";
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
const SKELETON_CELLS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9"];
const PAGE_SIZE = 10;
const MAX_BATCH = 50;

const BATCH_ACTIONS: {
  label: string;
  status: DonationStatus;
  color: string;
}[] = [
  {
    label: "Accept",
    status: { accepted: null },
    color:
      "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
  },
  {
    label: "Deliver",
    status: { delivered: null },
    color: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
  },
  {
    label: "Reject",
    status: { rejected: null },
    color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
  },
  {
    label: "Set Pending",
    status: { pending: null },
    color: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200",
  },
];

function getExpiryStatus(expiryDate: string): "expired" | "soon" | "ok" {
  if (!expiryDate) return "ok";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  if (expiry < today) return "expired";
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  if (expiry <= thirtyDaysFromNow) return "soon";
  return "ok";
}

/** AI Priority Engine: P = (U × S) / E */
function computePriority(donation: Donation): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = donation.expiryDate ? new Date(donation.expiryDate) : null;
  const daysToExpiry = expiry
    ? Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 9999;

  let U: number;
  if (daysToExpiry < 0) U = 5;
  else if (daysToExpiry < 7) U = 4;
  else if (daysToExpiry < 30) U = 3;
  else if (daysToExpiry < 90) U = 2;
  else U = 1;

  const qty = Number(donation.quantity);
  let S: number;
  if (qty <= 10) S = 1;
  else if (qty <= 50) S = 2;
  else if (qty <= 100) S = 3;
  else if (qty <= 500) S = 4;
  else S = 5;

  const E = donation.pickupAddress ? 1 : 2;

  return (U * S) / E;
}

type PriorityLevel = "High" | "Medium" | "Low";

function getPriorityLevel(score: number): PriorityLevel {
  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

function PriorityBadge({ donation }: { donation: Donation }) {
  const score = computePriority(donation);
  const level = getPriorityLevel(score);
  const styles: Record<PriorityLevel, string> = {
    High: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    Medium: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
    Low: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs font-semibold px-2 py-0.5 ${styles[level]}`}
    >
      {level}
    </Badge>
  );
}

function ExpiryCell({ expiryDate }: { expiryDate: string }) {
  const status = getExpiryStatus(expiryDate);
  if (status === "expired") {
    return (
      <span className="flex items-center gap-1 text-destructive font-medium">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {expiryDate}
      </span>
    );
  }
  if (status === "soon") {
    return <span className="text-amber-500 font-medium">{expiryDate}</span>;
  }
  return <span className="text-muted-foreground">{expiryDate}</span>;
}

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

function exportCSV(donations: Donation[]) {
  const headers = [
    "Medicine",
    "Donor",
    "Quantity",
    "Expiry Date",
    "Batch Number",
    "Priority",
    "Status",
    "Pickup Address",
    "Created At",
  ];
  const rows = donations.map((d) => {
    const score = computePriority(d);
    const priority = getPriorityLevel(score);
    return [
      d.medicineName,
      d.donorName,
      d.quantity.toString(),
      d.expiryDate,
      d.batchNumber ?? "",
      priority,
      Object.keys(d.status)[0],
      d.pickupAddress,
      new Date(Number(d.createdAt) / 1_000_000).toLocaleDateString(),
    ];
  });
  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medidonate-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [custodySheetOpen, setCustodySheetOpen] = useState(false);
  const [custodyDonation, setCustodyDonation] = useState<Donation | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const batchMutation = useBatchUpdateStatus();

  const handleFilterChange = (f: FilterStatus) => {
    onFilterChange(f);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    setSelectedIds(new Set());
  };

  const openCustody = (donation: Donation) => {
    setCustodyDonation(donation);
    setCustodySheetOpen(true);
  };

  // 1. Search filter
  const searchLower = search.toLowerCase();
  const searched = search
    ? donations.filter(
        (d) =>
          d.medicineName.toLowerCase().includes(searchLower) ||
          d.donorName.toLowerCase().includes(searchLower),
      )
    : donations;

  // 2. Status filter
  const filtered =
    filterStatus === "all"
      ? searched
      : searched.filter((d) => Object.keys(d.status)[0] === filterStatus);

  // 3. Priority sort (optional)
  const sorted = sortByPriority
    ? [...filtered].sort((a, b) => computePriority(b) - computePriority(a))
    : filtered;

  // 4. Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Selection helpers
  const pageIds = paginated.map((d) => d.id.toString());
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_BATCH) {
          toast.warning(
            `Maximum ${MAX_BATCH} donations can be selected at once`,
          );
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of pageIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of pageIds) {
          if (next.size < MAX_BATCH) next.add(id);
        }
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchUpdate = async (status: DonationStatus, label: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).map((id) => BigInt(id));
    try {
      const count = await batchMutation.mutateAsync({ ids, status });
      toast.success(
        `${count} donation${Number(count) !== 1 ? "s" : ""} marked as ${label.toLowerCase()}`,
      );
      clearSelection();
    } catch {
      toast.error("Batch update failed");
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by medicine or donor name…"
            className="pl-9"
            data-ocid="donations.search_input"
          />
        </div>

        {/* Filter Tabs + Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div
            className="flex gap-1.5 flex-wrap"
            data-ocid="donations.filter.tab"
          >
            {filters.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
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
          <div className="flex items-center gap-2">
            <Button
              variant={sortByPriority ? "default" : "outline"}
              size="sm"
              onClick={() => setSortByPriority((v) => !v)}
              className="flex items-center gap-1.5 shrink-0"
              data-ocid="donations.priority_sort.toggle"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortByPriority ? "Priority On" : "Sort by Priority"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-1.5 shrink-0"
              data-ocid="donations.export_button"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Batch action toolbar (admin only, shown when rows are selected) */}
        {isAdmin && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="text-sm font-medium text-foreground mr-1">
              {selectedIds.size} selected
              {selectedIds.size >= MAX_BATCH && (
                <span className="ml-1 text-amber-600 text-xs">(max)</span>
              )}
            </span>
            <span className="text-muted-foreground text-xs mr-1">
              Set status:
            </span>
            {BATCH_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={batchMutation.isPending}
                onClick={() => handleBatchUpdate(action.status, action.label)}
                className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
              >
                {batchMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                ) : null}
                {action.label}
              </button>
            ))}
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-lg border border-border/60 overflow-hidden bg-card shadow-card"
          data-ocid="donations.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {isAdmin && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageSelected}
                      data-state={
                        somePageSelected && !allPageSelected
                          ? "indeterminate"
                          : undefined
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all on page"
                      disabled={paginated.length === 0}
                    />
                  </TableHead>
                )}
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
                  Priority
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Location
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
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 9 : 8}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="donations.empty_state"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <p className="font-medium">No donations found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((donation, idx) => {
                  const rowIdStr = donation.id.toString();
                  const isChecked = selectedIds.has(rowIdStr);
                  return (
                    <TableRow
                      key={rowIdStr}
                      data-ocid={`donations.row.item.${(page - 1) * PAGE_SIZE + idx + 1}`}
                      className={isChecked ? "bg-primary/5" : undefined}
                    >
                      {isAdmin && (
                        <TableCell className="w-10">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleRow(rowIdStr)}
                            aria-label={`Select donation ${donation.medicineName}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {donation.medicineName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {donation.donorName}
                      </TableCell>
                      <TableCell>{donation.quantity.toString()}</TableCell>
                      <TableCell>
                        <ExpiryCell expiryDate={donation.expiryDate} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge donation={donation} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {donation.pickupAddress ? (
                          <span
                            className="flex items-center gap-1"
                            title={donation.pickupAddress}
                          >
                            <MapPin className="w-3 h-3 shrink-0 text-primary" />
                            <span className="truncate max-w-[140px] text-sm">
                              {donation.pickupAddress.length > 25
                                ? `${donation.pickupAddress.slice(0, 25)}…`
                                : donation.pickupAddress}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
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
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => openCustody(donation)}
                            title="View custody log"
                            data-ocid="donation.history_button"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && sorted.length > PAGE_SIZE && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-ocid="donations.pagination_prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                data-ocid="donations.pagination_next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chain of Custody Sheet */}
      <CustodyLogSheet
        open={custodySheetOpen}
        onClose={() => setCustodySheetOpen(false)}
        donationId={custodyDonation?.id ?? null}
        medicineName={custodyDonation?.medicineName ?? ""}
      />
    </>
  );
}
