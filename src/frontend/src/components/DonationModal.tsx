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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Donation } from "../backend.d";
import { useCreateDonation, useUpdateDonation } from "../hooks/useQueries";

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
  editDonation?: Donation | null;
}

export function DonationModal({
  open,
  onClose,
  editDonation,
}: DonationModalProps) {
  const isEdit = !!editDonation;
  const createMutation = useCreateDonation();
  const updateMutation = useUpdateDonation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState({
    donorName: "",
    medicineName: "",
    quantity: "",
    expiryDate: "",
    notes: "",
  });

  useEffect(() => {
    if (editDonation) {
      setForm({
        donorName: editDonation.donorName,
        medicineName: editDonation.medicineName,
        quantity: editDonation.quantity.toString(),
        expiryDate: editDonation.expiryDate,
        notes: editDonation.notes,
      });
    } else {
      setForm({
        donorName: "",
        medicineName: "",
        quantity: "",
        expiryDate: "",
        notes: "",
      });
    }
  }, [editDonation]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.donorName ||
      !form.medicineName ||
      !form.quantity ||
      !form.expiryDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (isEdit && editDonation) {
        await updateMutation.mutateAsync({
          id: editDonation.id,
          donorName: form.donorName,
          medicineName: form.medicineName,
          quantity: Number(form.quantity),
          expiryDate: form.expiryDate,
          notes: form.notes,
        });
        toast.success("Donation updated successfully");
      } else {
        await createMutation.mutateAsync({
          donorName: form.donorName,
          medicineName: form.medicineName,
          quantity: Number(form.quantity),
          expiryDate: form.expiryDate,
          notes: form.notes,
        });
        toast.success("Donation created successfully");
      }
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Suppress unused variable warning - open is used as Dialog prop
  void open;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" data-ocid="donation.dialog">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Donation" : "Create Donation"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="donorName">Donor Name *</Label>
              <Input
                id="donorName"
                data-ocid="donation.input"
                value={form.donorName}
                onChange={(e) => handleChange("donorName", e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medicineName">Medicine Name *</Label>
              <Input
                id="medicineName"
                data-ocid="donation.input"
                value={form.medicineName}
                onChange={(e) => handleChange("medicineName", e.target.value)}
                placeholder="e.g. Amoxicillin 500mg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity *</Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                data-ocid="donation.input"
                value={form.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              data-ocid="donation.textarea"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional information about the donation..."
              rows={3}
            />
          </div>
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
              data-ocid="donation.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Donation"
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
