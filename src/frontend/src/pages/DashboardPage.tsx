import { Button } from "@/components/ui/button";
import { Database, Heart, Loader2, Plus, RefreshCw, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Donation } from "../backend.d";
import { DonationModal } from "../components/DonationModal";
import { DonationsTable } from "../components/DonationsTable";
import { EcoAnalytics } from "../components/EcoAnalytics";
import { StatsCards } from "../components/StatsCards";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDonations,
  useSeedDonations,
  useSeedNeedRequests,
  useStats,
  useUserRole,
} from "../hooks/useQueries";

type FilterStatus = "all" | "pending" | "accepted" | "delivered" | "rejected";
type OwnerFilter = "all" | "mine";

export function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editDonation, setEditDonation] = useState<Donation | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [seedingMax, setSeedingMax] = useState(false);

  const {
    data: donations = [],
    isLoading: donationsLoading,
    refetch,
  } = useDonations();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: role } = useUserRole();
  const { identity } = useInternetIdentity();
  const seedMutation = useSeedDonations();
  const seedNeedsMutation = useSeedNeedRequests();

  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const filteredDonations =
    ownerFilter === "mine"
      ? donations.filter((d) => d.creatorPrincipal.toString() === myPrincipal)
      : donations;

  const handleCreate = () => {
    setEditDonation(null);
    setModalOpen(true);
  };

  const handleEdit = (donation: Donation) => {
    setEditDonation(donation);
    setModalOpen(true);
  };

  const handleSeed = async () => {
    try {
      const count = await seedMutation.mutateAsync();
      toast.success(`${count} sample donations added successfully!`);
    } catch {
      toast.error("Failed to seed donations");
    }
  };

  const handleSeedMax = async () => {
    setSeedingMax(true);
    try {
      let total = 0;
      for (let i = 0; i < 5; i++) {
        const count = await seedMutation.mutateAsync();
        total += Number(count);
      }
      toast.success(`${total} sample donations added successfully!`);
    } catch {
      toast.error("Failed to seed donations");
    } finally {
      setSeedingMax(false);
    }
  };

  const handleSeedNeeds = async () => {
    try {
      const count = await seedNeedsMutation.mutateAsync();
      toast.success(`${count} need requests added!`);
    } catch {
      toast.error("Failed to seed need requests");
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and track medicine donations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9"
              data-ocid="dashboard.secondary_button"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seedMutation.isPending}
              className="h-9"
              data-ocid="dashboard.seed_button"
            >
              {seedMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-1.5" />
              )}
              Seed 100 Donations
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedMax}
              disabled={seedingMax || seedMutation.isPending}
              className="h-9"
              data-ocid="dashboard.seed_max_button"
            >
              {seedingMax ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-1.5" />
              )}
              Seed Max (500)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedNeeds}
              disabled={seedNeedsMutation.isPending}
              className="h-9 border-amber-300 text-amber-700 hover:bg-amber-50"
              data-ocid="dashboard.seed_needs_button"
            >
              {seedNeedsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 mr-1.5" />
              )}
              Seed Need Requests
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              className="h-9"
              data-ocid="donation.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Donation
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StatsCards stats={stats} isLoading={statsLoading} />
        </motion.div>

        {/* Eco-Analytics Section */}
        <EcoAnalytics stats={stats} isLoading={statsLoading} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-card rounded-lg border border-border/60 shadow-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Donations
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredDonations.length} total donation
                {filteredDonations.length !== 1 ? "s" : ""}
              </p>
            </div>
            {/* All / Mine toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <button
                type="button"
                data-ocid="dashboard.tab"
                onClick={() => setOwnerFilter("all")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  ownerFilter === "all"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                data-ocid="dashboard.tab"
                onClick={() => setOwnerFilter("mine")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  ownerFilter === "mine"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mine
              </button>
            </div>
          </div>
          <DonationsTable
            donations={filteredDonations}
            isLoading={donationsLoading}
            role={role}
            onEdit={handleEdit}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
          />
        </motion.div>
      </div>

      <DonationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editDonation={editDonation}
      />
    </>
  );
}
