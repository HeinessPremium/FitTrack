import { useEffect, useState } from "react";
import { format, isFuture } from "date-fns";
import { CalendarClock, Users, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { BookingWithDetails } from "@/lib/types";
import { Card } from "@/components/ui/form";
import { formatNaira } from "@/lib/utils";

export default function CoachDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select(
          "*, slot:availability_slots(*), coach:coach_profiles(*, profile:profiles(*)), client:profiles(*)"
        )
        .eq("coach_id", profile.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });
      setBookings((data as unknown as BookingWithDetails[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  const upcoming = bookings.filter((b) => isFuture(new Date(b.slot.starts_at)));
  const uniqueClients = new Set(bookings.map((b) => b.client_id)).size;
  const totalEarnedKobo = bookings.reduce((sum, b) => sum + b.amount_kobo, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-ink">
          {profile?.avatar_emoji} Welcome, Coach {profile?.full_name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[0.9rem] text-ink/55">
          Here&apos;s how your coaching is going.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <CalendarClock size={18} />
          </div>
          <p className="text-[0.8rem] text-ink/55">Upcoming sessions</p>
          <p className="text-[1.4rem] font-semibold text-ink">{upcoming.length}</p>
        </Card>
        <Card>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent-soft text-brand-accent">
            <Users size={18} />
          </div>
          <p className="text-[0.8rem] text-ink/55">Clients coached</p>
          <p className="text-[1.4rem] font-semibold text-ink">{uniqueClients}</p>
        </Card>
        <Card>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Wallet size={18} />
          </div>
          <p className="text-[0.8rem] text-ink/55">Total earned</p>
          <p className="text-[1.4rem] font-semibold text-ink">
            {formatNaira(totalEarnedKobo)}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-[0.95rem] font-semibold text-ink">
          Next sessions
        </h2>
        {loading ? (
          <p className="text-[0.85rem] text-ink/45">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-[0.85rem] text-ink/45">
            Nothing booked yet. Add availability so clients can find a time.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.slice(0, 6).map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5 text-[0.87rem]">
                <span className="text-ink/75">{b.client.full_name}</span>
                <span className="text-ink/45">
                  {format(new Date(b.slot.starts_at), "MMM d, h:mm a")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
