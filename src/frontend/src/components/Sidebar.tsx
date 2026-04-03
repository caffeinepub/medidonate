import {
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  User,
  Users,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyProfile, useUserRole } from "../hooks/useQueries";

export type AppView = "dashboard" | "map" | "profile" | "users";

interface SidebarProps {
  view: AppView;
  onViewChange: (v: AppView) => void;
}

export function Sidebar({ view, onViewChange }: SidebarProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: role } = useUserRole();
  const { data: profileOption } = useMyProfile();

  const roleLabel = role ? Object.keys(role)[0] : "user";
  const isAdmin = role && "admin" in role;
  const principal = identity ? identity.getPrincipal().toString() : "";
  const principalShort = principal ? `${principal.slice(0, 10)}...` : "";

  const displayName =
    profileOption && profileOption.__kind__ === "Some"
      ? profileOption.value.displayName
      : null;

  type NavItem = {
    label: string;
    value: AppView;
    icon: React.ReactNode;
    adminOnly?: boolean;
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      value: "dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Donations",
      value: "dashboard",
      icon: <Package className="w-4 h-4" />,
    },
    {
      label: "Map View",
      value: "map",
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      label: "Profile",
      value: "profile",
      icon: <User className="w-4 h-4" />,
    },
    {
      label: "Users",
      value: "users",
      icon: <Users className="w-4 h-4" />,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

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
        {visibleItems.map((item) => (
          <button
            key={item.label}
            type="button"
            data-ocid="nav.link"
            onClick={() => onViewChange(item.value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
              view === item.value
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="w-4 h-4 text-sidebar-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {displayName || principalShort}
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
