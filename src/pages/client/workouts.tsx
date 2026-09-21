import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { WorkoutLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/form";

const EMPTY_FORM = {
  exercise_name: "",
  sets: "",
  reps: "",
  weight_kg: "",
  duration_minutes: "",
  notes: "",
};

export default function WorkoutsPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadLogs() {
    if (!profile) return;
    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("client_id", profile.id)
      .order("logged_at", { ascending: false })
      .order("created_at", { ascending: false });
    setLogs((data as WorkoutLog[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !form.exercise_name.trim()) return;
    setSaving(true);

    await supabase.from("workout_logs").insert({
      client_id: profile.id,
      exercise_name: form.exercise_name.trim(),
      sets: form.sets ? Number(form.sets) : null,
      reps: form.reps ? Number(form.reps) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      duration_minutes: form.duration_minutes
        ? Number(form.duration_minutes)
        : null,
      notes: form.notes.trim() || null,
    });

    setForm(EMPTY_FORM);
    setSaving(false);
    loadLogs();
  }

  async function handleDelete(id: string) {
    await supabase.from("workout_logs").delete().eq("id", id);
    loadLogs();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card className="h-fit">
        <h2 className="mb-4 text-[1rem] font-semibold text-ink">Log a workout</h2>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label htmlFor="exercise_name">Exercise</Label>
            <Input
              id="exercise_name"
              required
              placeholder="e.g. Bench press, 5k run"
              value={form.exercise_name}
              onChange={(e) => setForm({ ...form, exercise_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                min={0}
                value={form.sets}
                onChange={(e) => setForm({ ...form, sets: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                min={0}
                value={form.reps}
                onChange={(e) => setForm({ ...form, reps: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={0}
                step="0.5"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="duration">Duration (min) — for cardio</Label>
            <Input
              id="duration"
              type="number"
              min={0}
              value={form.duration_minutes}
              onChange={(e) =>
                setForm({ ...form, duration_minutes: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            <Plus size={16} /> {saving ? "Saving…" : "Add workout"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-[1rem] font-semibold text-ink">Your log</h2>
        {loading ? (
          <p className="text-[0.85rem] text-ink/45">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-[0.85rem] text-ink/45">
            Nothing logged yet — add your first workout.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[0.9rem] font-medium text-ink">
                    {log.exercise_name}
                  </p>
                  <p className="text-[0.8rem] text-ink/50">
                    {format(new Date(log.logged_at), "MMM d, yyyy")}
                    {log.sets && log.reps ? ` · ${log.sets}×${log.reps}` : ""}
                    {log.weight_kg ? ` · ${log.weight_kg}kg` : ""}
                    {log.duration_minutes ? ` · ${log.duration_minutes} min` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  aria-label="Delete"
                  className="text-ink/30 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
