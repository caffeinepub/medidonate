import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { useDonations } from "../hooks/useQueries";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  accepted: "bg-blue-500",
  delivered: "bg-green-500",
  rejected: "bg-red-500",
};

function getStatusKey(status: Record<string, null>): string {
  return Object.keys(status)[0] ?? "pending";
}

export function MapViewPage() {
  const { data: donations = [], isLoading } = useDonations();
  const [selected, setSelected] = useState<bigint | null>(null);

  const mappableDonations = donations.filter(
    (d) => d.pickupLat !== 0 && d.pickupLng !== 0,
  );

  const selectedDonation = selected
    ? mappableDonations.find((d) => d.id === selected)
    : null;

  const mapEmbedUrl = selectedDonation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedDonation.pickupLng - 0.05},${selectedDonation.pickupLat - 0.05},${selectedDonation.pickupLng + 0.05},${selectedDonation.pickupLat + 0.05}&layer=mapnik&marker=${selectedDonation.pickupLat},${selectedDonation.pickupLng}`
    : mappableDonations.length > 0
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${mappableDonations[0].pickupLng - 0.05},${mappableDonations[0].pickupLat - 0.05},${mappableDonations[0].pickupLng + 0.05},${mappableDonations[0].pickupLat + 0.05}&layer=mapnik&marker=${mappableDonations[0].pickupLat},${mappableDonations[0].pickupLng}`
      : null;

  return (
    <>
      <header className="bg-card border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Donation Map</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mappableDonations.length} donation
              {mappableDonations.length !== 1 ? "s" : ""} with location data
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full space-y-4"
        >
          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full inline-block ${colorClass}`}
                />
                <span className="text-sm text-muted-foreground capitalize">
                  {status}
                </span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div
              className="rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center"
              style={{ height: "480px" }}
              data-ocid="map.loading_state"
            >
              <p className="text-muted-foreground text-sm">
                Loading map data...
              </p>
            </div>
          ) : mappableDonations.length === 0 ? (
            <div
              className="rounded-lg border border-border/60 bg-muted/30 flex flex-col items-center justify-center gap-3"
              style={{ height: "480px" }}
              data-ocid="map.empty_state"
            >
              <MapPin className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                No donations with location data yet
              </p>
              <p className="text-sm text-muted-foreground">
                Add a pickup address and coordinates when creating a donation
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              style={{ minHeight: "480px" }}
            >
              {/* Map iframe */}
              <div
                className="lg:col-span-2 rounded-lg border border-border/60 overflow-hidden shadow-card"
                data-ocid="map.canvas_target"
              >
                {mapEmbedUrl && (
                  <iframe
                    title="Donation location map"
                    src={mapEmbedUrl}
                    width="100%"
                    height="480"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                )}
              </div>

              {/* Sidebar list */}
              <div
                className="flex flex-col gap-2 overflow-y-auto"
                style={{ maxHeight: "480px" }}
              >
                {mappableDonations.map((donation, idx) => {
                  const statusKey = getStatusKey(
                    donation.status as Record<string, null>,
                  );
                  const colorClass = STATUS_COLORS[statusKey] ?? "bg-gray-400";
                  const isActive = selected
                    ? donation.id === selected
                    : idx === 0;
                  return (
                    <Card
                      key={donation.id.toString()}
                      className={`cursor-pointer transition-all border-2 ${
                        isActive ? "border-primary" : "border-transparent"
                      }`}
                      onClick={() => setSelected(donation.id)}
                      data-ocid={`map.item.${idx + 1}`}
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorClass}`}
                          />
                          <p className="font-semibold text-sm truncate">
                            {donation.medicineName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {donation.donorName}
                        </p>
                        {donation.pickupAddress && (
                          <p className="text-xs text-muted-foreground truncate">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {donation.pickupAddress}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <StatusBadge status={donation.status} />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            asChild
                          >
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${donation.pickupLat}&mlon=${donation.pickupLng}#map=16/${donation.pickupLat}/${donation.pickupLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-ocid="map.link"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
