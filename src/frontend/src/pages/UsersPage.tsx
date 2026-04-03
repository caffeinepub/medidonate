import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllProfiles,
  useAssignRole,
  useUserRole,
} from "../hooks/useQueries";

export function UsersPage() {
  const { data: role } = useUserRole();
  const { identity } = useInternetIdentity();
  const { data: profiles = [], isLoading } = useAllProfiles();
  const assignRole = useAssignRole();

  const isAdmin = role && "admin" in role;
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  if (!isAdmin) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-12 text-center"
        data-ocid="users.error_state"
      >
        <div>
          <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Only administrators can view this page.
          </p>
        </div>
      </div>
    );
  }

  const handlePromote = async (principal: { toString(): string }) => {
    try {
      await assignRole.mutateAsync({
        principal: principal as any,
        role: { admin: null },
      });
      toast.success("User promoted to admin");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleDemote = async (principal: { toString(): string }) => {
    try {
      await assignRole.mutateAsync({
        principal: principal as any,
        role: { user: null },
      });
      toast.success("Admin demoted to user");
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              View and manage registered users
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card data-ocid="users.card">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {profiles.length} registered user
                {profiles.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2" data-ocid="users.loading_state">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : profiles.length === 0 ? (
                <div
                  className="text-center py-10 text-muted-foreground text-sm"
                  data-ocid="users.empty_state"
                >
                  No users found.
                </div>
              ) : (
                <Table data-ocid="users.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Principal</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map(([principal, profile], i) => {
                      const principalStr = principal.toString();
                      const isSelf = principalStr === myPrincipal;
                      // We don't have a getUserRole endpoint, so mark as N/A
                      // but still allow role assignment
                      return (
                        <TableRow
                          key={principalStr}
                          data-ocid={`users.row.${i + 1}`}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {principalStr.slice(0, 14)}...
                            {isSelf ? " (you)" : ""}
                          </TableCell>
                          <TableCell className="font-medium">
                            {profile.displayName || (
                              <span className="text-muted-foreground italic">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {profile.phone || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">N/A</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground">
                                (you)
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-ocid={`users.button.${i + 1}`}
                                  disabled={assignRole.isPending}
                                  onClick={() => handlePromote(principal)}
                                  className="h-7 text-xs"
                                >
                                  {assignRole.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : null}
                                  Promote to Admin
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  data-ocid={`users.button.${i + 1}`}
                                  disabled={assignRole.isPending}
                                  onClick={() => handleDemote(principal)}
                                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                >
                                  Demote to User
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
