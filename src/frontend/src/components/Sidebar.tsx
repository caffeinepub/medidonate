import {
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Package,
  User,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserRole } from "../hooks/useQueries";

export function Sidebar() {
  const { clear, identity } = useInternetIdentity();
  const { data: role } = useUserRole();

  const roleLabel = role ? Object.keys(role)[0] : "user";
  const principal = identity ? identity.getPrincipal().toString() : "";
  const principalShort = principal ? `${principal.slice(0, 10)}...` : "";

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground leading-none">
              MediDonate
            </p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">
              Medicine Management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2">
          Main
        </p>
        <button
          type="button"
          data-ocid="nav.link"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md bg-sidebar-accent text-sidebar-accent-foreground font-medium text-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        <button
          type="button"
          data-ocid="nav.link"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
        >
          <Package className="w-4 h-4" />
          Donations
        </button>
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="w-4 h-4 text-sidebar-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {principalShort}
            </p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">
              {roleLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            data-ocid="nav.logout_button"
            className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
