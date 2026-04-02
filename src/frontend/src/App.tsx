import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

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

  return <DashboardPage />;
}
