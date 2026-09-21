import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const CLIENT_LINKS = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/workouts", label: "Workouts" },
  { to: "/app/progress", label: "Progress" },
  { to: "/app/coaches", label: "Find a coach" },
  { to: "/app/bookings", label: "My sessions" },
];

const COACH_LINKS = [
  { to: "/coach", label: "Dashboard", end: true },
  { to: "/coach/availability", label: "Availability" },
  { to: "/coach/bookings", label: "Bookings" },
  { to: "/coach/profile", label: "Profile" },
];

export function AppShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const links = profile?.role === "coach" ? COACH_LINKS : CLIENT_LINKS;

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-tint">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[1.05rem] font-bold tracking-tight text-brand">
              Fit<span className="text-brand-accent">Track</span>
            </span>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3.5 py-2 text-[0.86rem] font-medium transition",
                    isActive
                      ? "bg-brand-soft text-brand"
                      : "text-ink/60 hover:text-ink"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-[0.85rem] text-ink/60 sm:inline">
              {profile?.avatar_emoji} {profile?.full_name}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-border px-3.5 py-2 text-[0.82rem] font-medium text-ink/70 hover:bg-tint"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex-none rounded-full px-3.5 py-1.5 text-[0.8rem] font-medium",
                  isActive ? "bg-brand-soft text-brand" : "text-ink/55"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
