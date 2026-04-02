import { Button } from "@/components/ui/button";
import { Clock, HeartPulse, Package, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function AuthPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground text-lg">
              MediDonate
            </p>
            <p className="text-xs text-sidebar-foreground/50">
              Medicine Donation Platform
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold text-sidebar-foreground leading-tight">
              Connecting medicine donors with those who need it most
            </h2>
            <p className="text-sidebar-foreground/60 mt-3 leading-relaxed">
              Track, manage, and verify medicine donations from collection to
              delivery — all in one secure platform.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { icon: Package, text: "Track donation lifecycle end-to-end" },
              {
                icon: Shield,
                text: "Secure, decentralized identity verification",
              },
              {
                icon: Clock,
                text: "Real-time status updates and notifications",
              },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-sidebar-foreground/70" />
                </div>
                <p className="text-sidebar-foreground/70 text-sm">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-sidebar-foreground/30 text-xs">
          © {new Date().getFullYear()} MediDonate. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-xl">MediDonate</p>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5">
              Sign in to manage medicine donations securely.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              className="w-full h-11 text-base font-semibold"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="auth.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <span className="mr-2 inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                "Sign In with Internet Identity"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={login}
                data-ocid="auth.secondary_button"
                className="text-primary font-medium hover:underline"
              >
                Create one for free
              </button>
            </p>
          </div>

          <div className="mt-10 p-4 rounded-lg bg-muted/50 border border-border/60">
            <p className="text-xs text-muted-foreground text-center">
              Powered by Internet Identity — decentralized, password-free
              authentication. Your identity is yours alone.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
