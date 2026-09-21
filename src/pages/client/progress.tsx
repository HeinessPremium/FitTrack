import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { BodyMetric } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/form";

export default function ProgressPage() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    if (!profile) return;
    const { data } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("client_id", profile.id)
      .order("recorded_at", { ascending: true });
    setMetrics((data as BodyMetric[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !weight) return;
    setSaving(true);
    await supabase.from("body_metrics").upsert(
      {
        client_id: profile.id,
        recorded_at: date,
        weight_kg: Number(weight),
      },
      { onConflict: "client_id,recorded_at" }
    );
    setWeight("");
    setSaving(false);
    loadMetrics();
  }

  const chartData = metrics.map((m) => ({
    date: format(new Date(m.recorded_at), "MMM d"),
    weight: m.weight_kg,
  }));

  const first = metrics[0];
  const latest = metrics[metrics.length - 1];
  const delta =
    first && latest ? (latest.weight_kg - first.weight_kg).toFixed(1) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card className="h-fit">
        <h2 className="mb-4 text-[1rem] font-semibold text-ink">Log your weight</h2>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min={0}
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Save entry"}
          </Button>
        </form>

        {delta !== null && (
          <p className="mt-4 rounded-lg bg-tint px-3 py-2.5 text-[0.85rem] text-ink/65">
            {Number(delta) <= 0 ? "Down" : "Up"} {Math.abs(Number(delta))} kg
            since your first entry.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-[1rem] font-semibold text-ink">
          Weight over time
        </h2>
        {loading ? (
          <p className="text-[0.85rem] text-ink/45">Loading…</p>
        ) : chartData.length < 2 ? (
          <p className="text-[0.85rem] text-ink/45">
            Log at least two entries to see your trend line.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,24,26,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="rgba(20,24,26,0.35)" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="rgba(20,24,26,0.35)"
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#1E6F5C"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
