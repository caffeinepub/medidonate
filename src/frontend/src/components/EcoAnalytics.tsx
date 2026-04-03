import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Medal, Truck, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { DonationStats } from "../backend.d";
import { useLeaderboard } from "../hooks/useQueries";

const GREEN_GOAL_KG = 1000;

function co2FromQuantity(qty: bigint): number {
  return Number(qty) * 0.5;
}

interface EcoAnalyticsProps {
  stats?: DonationStats | null;
  isLoading: boolean;
}

export function EcoAnalytics({ stats, isLoading }: EcoAnalyticsProps) {
  const { data: leaderboard = [], isLoading: lbLoading } = useLeaderboard();

  const totalCO2 = stats ? co2FromQuantity(stats.totalDeliveredQuantity) : 0;
  const deliveredCount = stats ? Number(stats.delivered) : 0;
  const progressPct = Math.min(100, (totalCO2 / GREEN_GOAL_KG) * 100);

  const top5 = leaderboard.slice(0, 5);
  const maxQty =
    top5.length > 0
      ? Math.max(...top5.map((e) => Number(e.deliveredQuantity)))
      : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      data-ocid="eco.section"
    >
      {/* CO2 Impact Card */}
      <Card className="lg:col-span-2 border-border/60 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-green-600" />
            </div>
            Eco-Analytics
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Green Goal: {GREEN_GOAL_KG.toLocaleString()} kg CO₂
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-green-50 border border-green-100 p-4">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      CO₂ Saved
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">
                    {totalCO2 % 1 === 0
                      ? totalCO2.toFixed(0)
                      : totalCO2.toFixed(1)}{" "}
                    kg
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">CO₂ offset</p>
                </>
              )}
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/15 p-4">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-primary font-medium">
                      Delivered
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {deliveredCount}
                  </p>
                  <p className="text-xs text-primary/60 mt-0.5">
                    donations delivered
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                Progress toward Green Goal
              </span>
              {isLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <span className="text-muted-foreground">
                  {progressPct.toFixed(1)}%
                </span>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-3 w-full rounded-full" />
            ) : (
              <div className="relative">
                <Progress
                  value={progressPct}
                  className="h-3 rounded-full bg-green-100"
                  data-ocid="eco.progress"
                />
              </div>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {totalCO2.toFixed(1)} of {GREEN_GOAL_KG} kg CO₂ —{" "}
                {progressPct >= 100
                  ? "🎉 Green Goal reached!"
                  : `${(GREEN_GOAL_KG - totalCO2).toFixed(1)} kg remaining`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Card */}
      <Card className="border-border/60 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Medal className="w-4 h-4 text-amber-600" />
            </div>
            Top Donors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lbLoading ? (
            <div className="space-y-3" data-ocid="eco.loading_state">
              {["a", "b", "c", "d", "e"].map((k) => (
                <div key={k} className="space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : top5.length === 0 ? (
            <div
              className="py-8 text-center text-sm text-muted-foreground"
              data-ocid="eco.empty_state"
            >
              No deliveries yet
            </div>
          ) : (
            <div className="space-y-3" data-ocid="eco.leaderboard.list">
              {top5.map((entry, idx) => {
                const pct =
                  maxQty > 0
                    ? (Number(entry.deliveredQuantity) / maxQty) * 100
                    : 0;
                const medals = ["🥇", "🥈", "🥉", "4.", "5."];
                return (
                  <div
                    key={`${entry.donorName}-${idx}`}
                    className="space-y-1"
                    data-ocid={`eco.leaderboard.item.${idx + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{medals[idx]}</span>
                        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                          {entry.donorName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {entry.deliveredQuantity.toString()} units
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
