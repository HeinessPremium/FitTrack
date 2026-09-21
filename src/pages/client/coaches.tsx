import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CoachWithProfile } from "@/lib/types";
import { CoachCard } from "@/components/coaches/coach-card";
import { BookingModal } from "@/components/coaches/booking-modal";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<CoachWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CoachWithProfile | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("*, profile:profiles(*)");
      setCoaches((data as unknown as CoachWithProfile[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[1.4rem] font-semibold tracking-tight text-ink">
          Find a coach
        </h1>
        <p className="mt-1 text-[0.9rem] text-ink/55">
          Book a real, paid session — pick a time that works for you.
        </p>
      </div>

      {loading ? (
        <p className="text-[0.9rem] text-ink/45">Loading coaches…</p>
      ) : coaches.length === 0 ? (
        <p className="text-[0.9rem] text-ink/45">
          No coaches have joined yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} onBook={setSelected} />
          ))}
        </div>
      )}

      <BookingModal
        coach={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
