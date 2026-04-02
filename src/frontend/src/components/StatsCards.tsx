import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import type { DonationStats } from "../backend.d";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

const SKELETON_KEYS = ["total", "pending", "accepted", "delivered", "rejected"];

function StatCard({ label, value, icon, colorClass, bgClass }: StatCardProps) {
  return (
    <Card className="shadow-card border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgClass}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({
  stats,
  isLoading,
}: { stats?: DonationStats | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {SKELETON_KEYS.map((k) => (
          <Card key={k} className="shadow-card">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards: StatCardProps[] = [
    {
      label: "Total Donations",
      value: stats ? stats.total.toString() : "0",
      icon: <Package className="w-5 h-5 text-primary" />,
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    {
      label: "Pending",
      value: stats ? stats.pending.toString() : "0",
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      colorClass: "text-yellow-700",
      bgClass: "bg-yellow-50",
    },
    {
      label: "Accepted",
      value: stats ? stats.accepted.toString() : "0",
      icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
      colorClass: "text-blue-700",
      bgClass: "bg-blue-50",
    },
    {
      label: "Delivered",
      value: stats ? stats.delivered.toString() : "0",
      icon: <Truck className="w-5 h-5 text-green-600" />,
      colorClass: "text-green-700",
      bgClass: "bg-green-50",
    },
    {
      label: "Rejected",
      value: stats ? stats.rejected.toString() : "0",
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      colorClass: "text-red-600",
      bgClass: "bg-red-50",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      data-ocid="stats.section"
    >
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
