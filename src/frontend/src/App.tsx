import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import type { AppView } from "./components/Sidebar";
import { Sidebar } from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MapViewPage } from "./pages/MapViewPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UsersPage } from "./pages/UsersPage";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [view, setView] = useState<AppView>("dashboard");

  if (isInitializing) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-ocid="app.loading_state"
      >
        <div className="space-y-3 w-48">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!identity) {
    return <AuthPage />;
  }

  function renderView() {
    switch (view) {
      case "dashboard":
        return <DashboardPage />;
      case "map":
        return <MapViewPage />;
      case "profile":
        return <ProfilePage />;
      case "users":
        return <UsersPage />;
      default:
        return <DashboardPage />;
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar view={view} onViewChange={setView} />
      <main className="flex-1 flex flex-col min-w-0">{renderView()}</main>
      <Toaster />
    </div>
  );
}
