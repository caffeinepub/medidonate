import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Hash, Heart, Loader2, MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Donation } from "../backend.d";
import { useCreateDonation, useUpdateDonation } from "../hooks/useQueries";
import { ExpiryScanner } from "./ExpiryScanner";

type Mode = "donate" | "need";

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
  editDonation?: Donation | null;
}

const emptyForm = {
  donorName: "",
  medicineName: "",
  quantity: "",
  expiryDate: "",
  batchNumber: "",
  notes: "",
  pickupAddress: "",
  pickupLat: "",
  pickupLng: "",
};

export function DonationModal({
  open,
  onClose,
  editDonation,
}: DonationModalProps) {
  const isEdit = !!editDonation;
  const createMutation = useCreateDonation();
  const updateMutation = useUpdateDonation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mode, setMode] = useState<Mode>("donate");

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editDonation) {
      setForm({
        donorName: editDonation.donorName,
        medicineName: editDonation.medicineName,
        quantity: editDonation.quantity.toString(),
        expiryDate: editDonation.expiryDate,
        batchNumber: editDonation.batchNumber ?? "",
        notes: editDonation.notes,
        pickupAddress: editDonation.pickupAddress,
        pickupLat:
          editDonation.pickupLat !== 0 ? editDonation.pickupLat.toString() : "",
        pickupLng:
          editDonation.pickupLng !== 0 ? editDonation.pickupLng.toString() : "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editDonation]);

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setForm(emptyForm);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          pickupLat: pos.coords.latitude.toFixed(6),
          pickupLng: pos.coords.longitude.toFixed(6),
        }));
        setGettingLocation(false);
        toast.success("Location captured");
      },
      () => {
        toast.error("Unable to retrieve your location");
        setGettingLocation(false);
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNeedMode = mode === "need";

    if (!form.donorName || !form.medicineName || !form.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!isNeedMode && !form.expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const expiryDate = isNeedMode ? "2099-12-31" : form.expiryDate;
      const notes = isNeedMode ? `[NEED REQUEST] ${form.notes}` : form.notes;
      const locationData = isNeedMode
        ? { pickupAddress: "", pickupLat: 0, pickupLng: 0 }
        : {
            pickupAddress: form.pickupAddress,
            pickupLat: form.pickupLat ? Number(form.pickupLat) : 0,
            pickupLng: form.pickupLng ? Number(form.pickupLng) : 0,
          };
      const batchNumber = isNeedMode ? "" : form.batchNumber;

      if (isEdit && editDonation) {
        await updateMutation.mutateAsync({
          id: editDonation.id,
          donorName: form.donorName,
          medicineName: form.medicineName,
          quantity: Number(form.quantity),
          expiryDate,
          batchNumber,
          notes,
          ...locationData,
        });
        toast.success("Donation updated successfully");
      } else {
        await createMutation.mutateAsync({
          donorName: form.donorName,
          medicineName: form.medicineName,
          quantity: Number(form.quantity),
          expiryDate,
          batchNumber,
          notes,
          ...locationData,
        });
        toast.success(
          isNeedMode
            ? "Need request submitted successfully!"
            : "Donation created successfully",
        );
      }
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const isNeedMode = mode === "need";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" data-ocid="donation.dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Donation" : "New Entry"}</DialogTitle>
        </DialogHeader>

        {/* Mode toggle — only shown for new entries */}
        {!isEdit && (
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <button
              type="button"
              data-ocid="donation.tab"
              onClick={() => handleModeSwitch("donate")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                mode === "donate"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Donate Medicine
            </button>
            <button
              type="button"
              data-ocid="donation.tab"
              onClick={() => handleModeSwitch("need")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                mode === "need"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Request as Person in Need
            </button>
          </div>
        )}

        {/* Need mode badge */}
        {isNeedMode && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700 flex items-center gap-1.5 px-2.5 py-1"
            >
              <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Person in Need Request
            </Badge>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="donorName">
                {isNeedMode ? "Your Full Name" : "Donor Name"} *
              </Label>
              <Input
                id="donorName"
                data-ocid="donation.input"
                value={form.donorName}
                onChange={(e) => handleChange("donorName", e.target.value)}
                placeholder={
                  isNeedMode ? "e.g. Ahmed Al-Rashid" : "e.g. John Doe"
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medicineName">Medicine Name *</Label>
              <Input
                id="medicineName"
                data-ocid="donation.input"
                value={form.medicineName}
                onChange={(e) => handleChange("medicineName", e.target.value)}
                placeholder={
                  isNeedMode
                    ? "e.g. Insulin, Salbutamol Inhaler"
                    : "e.g. Amoxicillin 500mg"
                }
              />
            </div>
          </div>

          {/* Batch Number — hidden in need mode */}
          {!isNeedMode && (
            <div className="space-y-1.5">
              <Label
                htmlFor="batchNumber"
                className="flex items-center gap-1.5"
              >
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                Batch / Lot Number
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="batchNumber"
                data-ocid="donation.input"
                value={form.batchNumber}
                onChange={(e) => handleChange("batchNumber", e.target.value)}
                placeholder="e.g. LOT-2024-XYZ"
              />
            </div>
          )}

          <div
            className={`grid gap-4 ${
              isNeedMode ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            <div className="space-y-1.5">
              <Label htmlFor="quantity">
                {isNeedMode ? "Quantity Needed" : "Quantity"} *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                data-ocid="donation.input"
                value={form.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="e.g. 100"
              />
            </div>

            {/* Expiry Date — hidden in need mode */}
            {!isNeedMode && (
              <div className="space-y-1.5">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="expiryDate"
                    type="date"
                    data-ocid="donation.input"
                    value={form.expiryDate}
                    onChange={(e) => handleChange("expiryDate", e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <ExpiryScanner
                    onDateFound={(d) => handleChange("expiryDate", d)}
                    onBatchDetected={(b) => handleChange("batchNumber", b)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              {isNeedMode ? "Medical Condition / Reason" : "Notes"}
            </Label>
            <Textarea
              id="notes"
              data-ocid="donation.textarea"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder={
                isNeedMode
                  ? "e.g. Diabetic patient needing daily insulin, unable to afford..."
                  : "Additional information about the donation..."
              }
              rows={3}
            />
          </div>

          {/* Pickup Location — hidden in need mode */}
          {!isNeedMode && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Pickup Location
                </span>
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pickupAddress">Address</Label>
                <Input
                  id="pickupAddress"
                  data-ocid="donation.input"
                  value={form.pickupAddress}
                  onChange={(e) =>
                    handleChange("pickupAddress", e.target.value)
                  }
                  placeholder="e.g. 123 Main St, City, Country"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pickupLat">Latitude</Label>
                  <Input
                    id="pickupLat"
                    type="number"
                    step="any"
                    data-ocid="donation.input"
                    value={form.pickupLat}
                    onChange={(e) => handleChange("pickupLat", e.target.value)}
                    placeholder="e.g. 40.7128"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pickupLng">Longitude</Label>
                  <Input
                    id="pickupLng"
                    type="number"
                    step="any"
                    data-ocid="donation.input"
                    value={form.pickupLng}
                    onChange={(e) => handleChange("pickupLng", e.target.value)}
                    placeholder="e.g. -74.0060"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseMyLocation}
                disabled={gettingLocation}
                className="w-full"
                data-ocid="donation.secondary_button"
              >
                {gettingLocation ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="mr-2 h-4 w-4" />
                )}
                Use My Location
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="donation.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={
                isNeedMode ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
              }
              data-ocid="donation.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit
                    ? "Updating..."
                    : isNeedMode
                      ? "Submitting..."
                      : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Donation"
              ) : isNeedMode ? (
                "Submit Request"
              ) : (
                "Create Donation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
