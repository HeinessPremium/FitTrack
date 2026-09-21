import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";

export function ProtectedRoute({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink/50">
        Loading…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink/50">
        Setting up your account…
      </div>
    );
  }

  if (profile.role !== role) {
    return (
      <Navigate to={profile.role === "coach" ? "/coach" : "/app"} replace />
    );
  }

  return <>{children}</>;
}
