import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AvailabilitySlot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export default function CoachAvailabilityPage() {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadSlots() {
    if (!profile) return;
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("coach_id", profile.id)
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    setSlots((data as AvailabilitySlot[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!profile || !date || !time) return;
    setSaving(true);
    const startsAt = new Date(`${date}T${time}:00`);
    await supabase.from("availability_slots").insert({
      coach_id: profile.id,
      starts_at: startsAt.toISOString(),
    });
    setSaving(false);
    loadSlots();
  }

  async function handleDelete(id: string) {
    await supabase.from("availability_slots").delete().eq("id", id);
    loadSlots();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card className="h-fit">
        <h2 className="mb-4 text-[1rem] font-semibold text-ink">
          Open a new time slot
        </h2>
        <form onSubmit={handleAdd} className="space-y-3.5">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              required
              min={format(new Date(), "yyyy-MM-dd")}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="time">Start time</Label>
            <Input
              id="time"
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <p className="text-[0.78rem] text-ink/45">
            Each slot is a 1-hour session.
          </p>
          <Button type="submit" className="w-full" disabled={saving}>
            <Plus size={16} /> {saving ? "Adding…" : "Add slot"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-[1rem] font-semibold text-ink">
          Your upcoming slots
        </h2>
        {loading ? (
          <p className="text-[0.85rem] text-ink/45">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="text-[0.85rem] text-ink/45">
            No open slots yet — add one to let clients book you.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {slots.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[0.9rem] font-medium text-ink">
                    {format(new Date(slot.starts_at), "EEEE, MMM d")}
                  </p>
                  <p className="text-[0.8rem] text-ink/50">
                    {format(new Date(slot.starts_at), "h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[0.72rem] font-medium",
                      slot.is_booked
                        ? "bg-brand-soft text-brand"
                        : "bg-tint text-ink/50"
                    )}
                  >
                    {slot.is_booked ? "Booked" : "Open"}
                  </span>
                  {!slot.is_booked && (
                    <button
                      onClick={() => handleDelete(slot.id)}
                      aria-label="Remove slot"
                      className="text-ink/30 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
