import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CalendarCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { WorkoutLog, BodyMetric, BookingWithDetails } from "@/lib/types";
import { Card } from "@/components/ui/form";
import { formatNaira } from "@/lib/utils";
import { format } from "date-fns";

export default function ClientDashboard() {
  const { profile } = useAuth();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [latestWeight, setLatestWeight] = useState<BodyMetric | null>(null);
  const [upcoming, setUpcoming] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [{ data: workouts }, { data: metrics }, { data: bookings }] =
        await Promise.all([
          supabase
            .from("workout_logs")
            .select("*")
            .eq("client_id", profile.id)
            .order("logged_at", { ascending: false })
            .limit(5),
          supabase
            .from("body_metrics")
            .select("*")
            .eq("client_id", profile.id)
            .order("recorded_at", { ascending: false })
            .limit(1),
          supabase
            .from("bookings")
            .select(
              "*, slot:availability_slots(*), coach:coach_profiles(*, profile:profiles(*)), client:profiles(*)"
            )
            .eq("client_id", profile.id)
            .eq("status", "confirmed")
            .order("created_at", { ascending: false }),
        ]);

      setRecentWorkouts((workouts as WorkoutLog[]) ?? []);
      setLatestWeight((metrics?.[0] as BodyMetric) ?? null);
      const now = Date.now();
      const future = ((bookings as unknown as BookingWithDetails[]) ?? [])
        .filter((b) => new Date(b.slot.starts_at).getTime() > now)
        .sort(
          (a, b) =>
            new Date(a.slot.starts_at).getTime() -
            new Date(b.slot.starts_at).getTime()
        );
      setUpcoming(future);
      setLoading(false);
    })();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-ink">
          {profile?.avatar_emoji} Welcome back, {profile?.full_name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[0.9rem] text-ink/55">
          Here&apos;s where your training stands today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Activity size={18} />
          </div>
          <p className="text-[0.8rem] text-ink/55">Logged this week</p>
          <p className="text-[1.4rem] font-semibold text-ink">
            {recentWorkouts.length}
          </p>
        </Card>
        <Card>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent-soft text-brand-accent">
            <TrendingUp size={18} />
          </div>
          <p className="text-[0.8rem] text-ink/55">Latest weight</p>
          <p className="text-[1.4rem] font-semibold text-ink">
            {latestWeight ? `${latestWeight.weight_kg} kg` : "—"}
          </p>
        </Card>
        <Card>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <CalendarCheck size={18} />
          </div>
          <p className="text-[0.8rem] text-ink/55">Upcoming sessions</p>
          <p className="text-[1.4rem] font-semibold text-ink">
            {upcoming.length}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[0.95rem] font-semibold text-ink">
              Recent workouts
            </h2>
            <Link to="/app/workouts" className="text-[0.82rem] font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-[0.85rem] text-ink/45">Loading…</p>
          ) : recentWorkouts.length === 0 ? (
            <p className="text-[0.85rem] text-ink/45">
              No workouts logged yet — add your first one.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {recentWorkouts.map((w) => (
                <li key={w.id} className="flex items-center justify-between text-[0.87rem]">
                  <span className="text-ink/75">{w.exercise_name}</span>
                  <span className="text-ink/45">
                    {format(new Date(w.logged_at), "MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[0.95rem] font-semibold text-ink">
              Upcoming sessions
            </h2>
            <Link to="/app/coaches" className="text-[0.82rem] font-medium text-brand hover:underline">
              Book another
            </Link>
          </div>
          {loading ? (
            <p className="text-[0.85rem] text-ink/45">Loading…</p>
          ) : upcoming.length === 0 ? (
            <p className="text-[0.85rem] text-ink/45">
              No sessions booked yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-[0.87rem]">
                  <span className="text-ink/75">
                    {b.coach.profile.full_name}
                  </span>
                  <span className="text-ink/45">
                    {format(new Date(b.slot.starts_at), "MMM d, h:mm a")} ·{" "}
                    {formatNaira(b.amount_kobo)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
