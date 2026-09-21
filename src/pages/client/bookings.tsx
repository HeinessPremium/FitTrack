import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { BookingWithDetails } from "@/lib/types";
import { Card } from "@/components/ui/form";
import { Badge } from "@/components/ui/form";
import { formatNaira, cn } from "@/lib/utils";

export default function ClientBookingsPage() {
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
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });
      setBookings((data as unknown as BookingWithDetails[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  return (
    <div>
      <h1 className="mb-6 text-[1.4rem] font-semibold tracking-tight text-ink">
        My sessions
      </h1>

      {loading ? (
        <p className="text-[0.9rem] text-ink/45">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="text-[0.9rem] text-ink/45">
          No sessions booked yet — find a coach to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="flex items-center justify-between">
              <div>
                <p className="text-[0.92rem] font-medium text-ink">
                  {b.coach.profile.full_name}
                </p>
                <p className="text-[0.82rem] text-ink/50">
                  {format(new Date(b.slot.starts_at), "EEEE, MMM d 'at' h:mm a")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.88rem] font-medium text-ink/70">
                  {formatNaira(b.amount_kobo)}
                </span>
                <Badge
                  className={cn(
                    b.status === "confirmed" && "bg-brand-soft text-brand",
                    b.status === "pending_payment" &&
                      "bg-brand-accent-soft text-brand-accent",
                    b.status === "cancelled" && "bg-red-50 text-red-500"
                  )}
                >
                  {b.status === "pending_payment"
                    ? "Awaiting payment"
                    : b.status === "confirmed"
                    ? "Confirmed"
                    : "Cancelled"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
