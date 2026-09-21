import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get("role") === "coach" ? "coach" : "client";

  const [role, setRole] = useState<Role>(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("15000");
  const [yearsExperience, setYearsExperience] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error, needsEmailConfirmation } = await signUp({
      email,
      password,
      fullName,
      role,
      coach:
        role === "coach"
          ? {
              specialty,
              bio,
              hourlyRateNaira: Number(hourlyRate) || 0,
              yearsExperience: Number(yearsExperience) || 0,
            }
          : undefined,
    });

    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    if (needsEmailConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    setDone(true);
    setTimeout(() => navigate(role === "coach" ? "/coach" : "/app"), 900);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tint px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-7">
        <Link to="/" className="mb-6 block text-center text-[1.05rem] font-bold text-brand">
          Fit<span className="text-brand-accent">Track</span>
        </Link>
        <h1 className="mb-5 text-center text-[1.2rem] font-semibold text-ink">
          Create your account
        </h1>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-tint p-1">
          {(["client", "coach"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-full py-2 text-[0.86rem] font-medium transition",
                role === r ? "bg-white text-brand shadow-sm" : "text-ink/50"
              )}
            >
              {r === "client" ? "I'm training" : "I'm a coach"}
            </button>
          ))}
        </div>

        {done ? (
          <p className="rounded-lg bg-brand-soft px-3 py-3 text-center text-[0.9rem] font-medium text-brand">
            Account created — taking you in…
          </p>
        ) : needsConfirmation ? (
          <p className="rounded-lg bg-brand-soft px-3 py-3 text-center text-[0.9rem] font-medium text-brand">
            Almost there — check your email for a confirmation link, then
            log in.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {role === "coach" && (
              <>
                <div>
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    required
                    placeholder="e.g. Strength & conditioning"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Short bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    required
                    placeholder="Tell clients about your experience and approach"
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
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="years">Years experience</Label>
                    <Input
                      id="years"
                      type="number"
                      min={0}
                      required
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-[0.85rem] text-ink/55">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
