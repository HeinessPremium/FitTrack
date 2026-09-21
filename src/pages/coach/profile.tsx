import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { CoachProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input, Label, Textarea } from "@/components/ui/form";

export default function CoachProfilePage() {
  const { profile } = useAuth();
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("id", profile.id)
        .maybeSingle();
      const c = data as CoachProfile | null;
      if (c) {
        setCoach(c);
        setSpecialty(c.specialty);
        setBio(c.bio);
        setRate(String(Math.round(c.hourly_rate_kobo / 100)));
        setYears(String(c.years_experience));
      }
    })();
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from("coach_profiles")
      .update({
        specialty,
        bio,
        hourly_rate_kobo: Math.round(Number(rate) * 100),
        years_experience: Number(years),
      })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
  }

  if (!coach) {
    return <p className="text-[0.9rem] text-ink/45">Loading…</p>;
  }

  return (
    <Card className="max-w-lg">
      <h1 className="mb-5 text-[1.2rem] font-semibold text-ink">
        Your coach profile
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="specialty">Specialty</Label>
          <Input
            id="specialty"
            required
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={4}
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="rate">Rate per session (₦)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="years">Years experience</Label>
            <Input
              id="years"
              type="number"
              min={0}
              required
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>
        </div>
        {saved && (
          <p className="text-[0.82rem] font-medium text-brand">
            Saved — clients will see this right away.
          </p>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
