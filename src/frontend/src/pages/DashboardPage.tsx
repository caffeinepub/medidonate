import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Plus, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Donation } from "../backend.d";
import { DonationModal } from "../components/DonationModal";
import { DonationsTable } from "../components/DonationsTable";
import { Sidebar } from "../components/Sidebar";
import { StatsCards } from "../components/StatsCards";
import { useDonations, useStats, useUserRole } from "../hooks/useQueries";

type FilterStatus = "all" | "pending" | "accepted" | "delivered" | "rejected";

export function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editDonation, setEditDonation] = useState<Donation | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const {
    data: donations = [],
    isLoading: donationsLoading,
    refetch,
  } = useDonations();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: role } = useUserRole();

  const handleCreate = () => {
    setEditDonation(null);
    setModalOpen(true);
  };

  const handleEdit = (donation: Donation) => {
    setEditDonation(donation);
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatsCards stats={stats} isLoading={statsLoading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card rounded-lg border border-border/60 shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Donations
                </h2>
                <p className="text-sm text-muted-foreground">
                  {donations.length} total donation
                  {donations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <DonationsTable
              donations={donations}
              isLoading={donationsLoading}
              role={role}
              onEdit={handleEdit}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
            />
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-border/60 bg-card">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </main>

      <DonationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editDonation={editDonation}
      />
      <Toaster />
    </div>
  );
}
