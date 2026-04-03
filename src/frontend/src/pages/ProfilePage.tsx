import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Donation } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useMyProfile,
  useSetMyProfile,
  useUserDonations,
} from "../hooks/useQueries";

function getStatusLabel(status: Donation["status"]): string {
  return Object.keys(status)[0];
}

function StatusBadge({ status }: { status: Donation["status"] }) {
  const label = getStatusLabel(status);
  const variants: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    accepted: "bg-blue-100 text-blue-800 border-blue-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${
        variants[label] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function isExpiringSoon(expiryDate: string): boolean {
  const d = new Date(expiryDate);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs >= 0 && diffMs < 30 * 24 * 60 * 60 * 1000;
}

function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export function ProfilePage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal() ?? null;
  const principalStr = principal?.toString() ?? "";

  const { data: profileOption, isLoading: profileLoading } = useMyProfile();
  const { data: myDonations = [], isLoading: donationsLoading } =
    useUserDonations(principal);
  const setProfileMutation = useSetMyProfile();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profileOption && profileOption.__kind__ === "Some") {
      setDisplayName(profileOption.value.displayName);
      setPhone(profileOption.value.phone);
      setBio(profileOption.value.bio);
    }
  }, [profileOption]);

  const handleSave = async () => {
    try {
      await setProfileMutation.mutateAsync({ displayName, phone, bio });
      toast.success("Profile saved successfully");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your account information
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6 max-w-2xl">
        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card data-ocid="profile.card">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Update your display name, phone, and bio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Principal (read-only) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Principal ID
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono break-all text-muted-foreground">
                    {principalStr || "—"}
                  </code>
                </div>
              </div>

              {profileLoading ? (
                <div className="space-y-3" data-ocid="profile.loading_state">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      data-ocid="profile.input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      data-ocid="profile.input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      data-ocid="profile.textarea"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us a bit about yourself"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={setProfileMutation.isPending}
                    data-ocid="profile.save_button"
                    className="w-full sm:w-auto"
                  >
                    {setProfileMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {setProfileMutation.isPending
                      ? "Saving..."
                      : "Save Profile"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* My Donations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card data-ocid="profile.panel">
            <CardHeader>
              <CardTitle>My Donations</CardTitle>
              <CardDescription>Donations you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
              {donationsLoading ? (
                <div className="space-y-2" data-ocid="profile.loading_state">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : myDonations.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground text-sm"
                  data-ocid="profile.empty_state"
                >
                  You haven't submitted any donations yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                          Medicine
                        </th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                          Qty
                        </th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                          Expiry
                        </th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {myDonations.map((d, i) => (
                        <tr
                          key={d.id.toString()}
                          data-ocid={`profile.item.${i + 1}`}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 px-2 font-medium">
                            {d.medicineName}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {d.quantity.toString()}
                          </td>
                          <td
                            className={`py-2 px-2 text-xs ${
                              isExpired(d.expiryDate)
                                ? "text-red-600 font-medium"
                                : isExpiringSoon(d.expiryDate)
                                  ? "text-amber-600 font-medium"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {d.expiryDate}
                          </td>
                          <td className="py-2 px-2">
                            <StatusBadge status={d.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
