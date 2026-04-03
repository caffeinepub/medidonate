import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import type { DonationStatus } from "../backend.d";
import { useCustodyLog } from "../hooks/useQueries";

function statusLabel(s: DonationStatus): string {
  if ("pending" in s) return "Pending";
  if ("accepted" in s) return "Accepted";
  if ("delivered" in s) return "Delivered";
  if ("rejected" in s) return "Rejected";
  return "Unknown";
}

function statusColor(s: DonationStatus): string {
  if ("pending" in s) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if ("accepted" in s) return "bg-blue-100 text-blue-800 border-blue-200";
  if ("delivered" in s) return "bg-green-100 text-green-800 border-green-200";
  if ("rejected" in s) return "bg-red-100 text-red-800 border-red-200";
  return "";
}

function shortPrincipal(p: { toString(): string }): string {
  const str = p.toString();
  return str.length > 8 ? `${str.slice(0, 8)}...` : str;
}

interface CustodyLogSheetProps {
  open: boolean;
  onClose: () => void;
  donationId: bigint | null;
  medicineName: string;
}

export function CustodyLogSheet({
  open,
  onClose,
  donationId,
  medicineName,
}: CustodyLogSheetProps) {
  const { data: log = [], isLoading } = useCustodyLog(open ? donationId : null);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md" data-ocid="custody.sheet">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Chain of Custody</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {medicineName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Separator className="mb-4" />

        <ScrollArea className="h-[calc(100vh-140px)] pr-4">
          {isLoading ? (
            <div className="space-y-4" data-ocid="custody.loading_state">
              {["a", "b", "c"].map((k) => (
                <div key={k} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : log.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="custody.empty_state"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  No status changes recorded yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status transitions will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1" data-ocid="custody.list">
              {log.map((event, idx) => (
                <div
                  key={`${event.timestamp.toString()}-${idx}`}
                  className="relative"
                  data-ocid={`custody.item.${idx + 1}`}
                >
                  {/* Timeline line */}
                  {idx < log.length - 1 && (
                    <div className="absolute left-[15px] top-10 bottom-0 w-px bg-border" />
                  )}
                  <div className="flex gap-3 pb-4">
                    {/* Timeline dot */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 mt-0.5 z-10">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Status transition */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(
                            event.oldStatus,
                          )}`}
                        >
                          {statusLabel(event.oldStatus)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(
                            event.newStatus,
                          )}`}
                        >
                          {statusLabel(event.newStatus)}
                        </span>
                      </div>
                      {/* Meta */}
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {shortPrincipal(event.changedBy)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            Number(event.timestamp) / 1_000_000,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
