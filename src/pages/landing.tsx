import { Link } from "react-router-dom";
import { Activity, CalendarCheck, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-[1.1rem] font-bold tracking-tight text-brand">
            Fit<span className="text-brand-accent">Track</span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[0.88rem] font-medium text-ink/70 hover:text-ink">
              Log in
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <span className="mb-5 inline-flex items-center rounded-full bg-brand-soft px-3.5 py-1.5 text-[0.8rem] font-semibold text-brand">
            Train with real accountability
          </span>
          <h1 className="text-[2.4rem] font-bold leading-[1.08] tracking-tight text-ink sm:text-[3.1rem]">
            Track your training.
            <br />
            Book a real coach.
          </h1>
          <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-ink/60">
            Log every workout, watch your progress add up, and when you want
            expert eyes on your form, book and pay for a real session with a
            personal coach — right from the app.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup?role=client">
              <Button size="lg">Start tracking — I&apos;m a client</Button>
            </Link>
            <Link to="/signup?role=coach">
              <Button size="lg" variant="outline">
                I&apos;m a coach
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              icon: Activity,
              title: "Log workouts in seconds",
              desc: "Exercises, sets, reps, weight, or cardio duration — whatever your training looks like.",
            },
            {
              icon: LineChart,
              title: "See your progress add up",
              desc: "A simple weight-over-time chart shows the trend, not just today's number.",
            },
            {
              icon: CalendarCheck,
              title: "Book & pay a real coach",
              desc: "Browse coaches, pick an open slot, and pay securely — no back-and-forth messages.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-border p-5">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-[0.95rem] font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-ink/55">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-[0.78rem] text-ink/40">
        FitTrack — a demo product. Payments run through Paystack.
      </footer>
    </div>
  );
}
