# FitTrack

A real (not demo) fitness app: clients log workouts and track progress,
then browse and pay real coaches for real booked sessions. Built with
Vite + React + TypeScript + Tailwind, Supabase (Postgres + Auth + Edge
Functions), and Paystack for payment — every piece on a free tier.

**This is a real product architecture**, unlike the Heiness Foods demo:
- Real auth (Supabase), not a mock session
- Real database with Row Level Security, not localStorage
- Real payment verification (a server-side Edge Function asks Paystack
  directly whether a payment succeeded) before any booking is confirmed

You do need to do a bit of one-time setup yourself — I can't create
accounts or type in your own free-tier API keys on your behalf. Follow
this in order; skipping steps will cause specific, predictable errors
(noted below) rather than silent failures.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a free Supabase project

1. Go to https://supabase.com, sign up (free), and create a new project.
2. Wait for it to finish provisioning (~2 minutes).
3. Go to **Project Settings → API**. You'll need three values from here:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (keep this one secret — never put it in frontend code)

## 3. Run the database migration

1. In your Supabase project, open the **SQL Editor**.
2. Open `supabase/migrations/0001_init.sql` from this project, copy its
   entire contents, paste into the SQL Editor, and click **Run**.
3. This creates every table (`profiles`, `coach_profiles`,
   `availability_slots`, `bookings`, `workout_logs`, `body_metrics`),
   turns on Row Level Security with the correct policies, and creates the
   `book_slot()` function the booking flow depends on.

## 4. Create a free Paystack account

1. Go to https://paystack.com and sign up (free — no cost until you
   process a real live transaction, and their **test mode** is
   completely free to use indefinitely).
2. In the dashboard, go to **Settings → API Keys & Webhooks**.
3. Copy your **Test Public Key** (`pk_test_...`) and **Test Secret Key**
   (`sk_test_...`). Use test mode while developing — test card numbers
   are listed in Paystack's docs, so you can run through the whole
   booking flow without moving real money.

## 5. Set your local environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
- `VITE_SUPABASE_URL` — your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon key
- `VITE_PAYSTACK_PUBLIC_KEY` — your Paystack **test** public key

(`.env.local` is already git-ignored — it will never get committed.)

## 6. Deploy the verify-payment Edge Function

This is the piece that actually confirms payment server-side. It needs
the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref   # find this in your Supabase project URL
supabase functions deploy verify-payment
```

Then set its one required secret (this stays on Supabase's servers —
never in your frontend code or git repo):

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_key_here
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already available to
every Edge Function automatically — Supabase injects them for you, and
in fact its CLI refuses to let you set anything starting with
`SUPABASE_` yourself. The only secret you ever need to set by hand here
is the Paystack one.

## 7. Run it locally

```bash
npm run dev
```

Open http://localhost:5173. Sign up once as a coach (add a specialty,
bio, and rate), open a couple of availability slots, then sign up again
with a different email as a client, browse to that coach, and book a
slot using a Paystack test card. If the whole flow completes and the
booking shows "Confirmed", the Edge Function is wired up correctly.

**A note on email confirmation:** Supabase requires email confirmation
by default, so after signing up you'll see "check your email" rather
than being dropped straight in. For faster local testing, you can turn
this off in **Authentication → Providers → Email → Confirm email**
(toggle off) — just remember to turn it back on before real users sign
up, or use a real email provider (Supabase's built-in email sending is
rate-limited and meant for testing, not production volume).

**If booking fails at the payment step**, the two most common causes are:
- The Edge Function secrets weren't set (step 6) — check with
  `supabase secrets list`
- You're using a live Paystack key instead of a test one while testing

## 8. Deploy (free hosting)

Either Netlify or Cloudflare Pages work well for a Vite app, both free:

**Netlify:**
1. Push this project to GitHub (same `git init` → `git add .` →
   `git commit` → create a repo on GitHub → `git remote add origin ...` →
   `git push` flow as before).
2. On https://netlify.com, "Add new site" → "Import an existing project"
   → pick your repo.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Add your three `VITE_...` environment variables (from step 5) in
   Netlify's site settings — **Site configuration → Environment variables**.
5. Deploy.

**Cloudflare Pages** works the same way: build command `npm run build`,
output directory `dist`, same three environment variables added in the
Pages project's settings.

## Architecture notes

- **`src/lib/supabase.ts`** — the one Supabase client instance, used
  everywhere via the `anon` key (safe for the browser — Row Level
  Security is what actually protects the data, not key secrecy).
- **`src/lib/auth-context.tsx`** — wraps Supabase auth + the matching
  `profiles` row (which carries the `role: "client" | "coach"` that
  drives routing).
- **`src/lib/paystack.ts`** — lazy-loads Paystack's inline checkout
  script and wraps it in a typed helper. This is the *only* place that
  talks to Paystack from the browser — it never decides whether a
  payment succeeded, it just opens the checkout and reports back
  whatever reference Paystack gives it.
- **`supabase/functions/verify-payment/`** — the only place a booking
  can be marked `confirmed`. It re-fetches the real transaction status
  from Paystack's own API using a secret key that never reaches the
  browser, and cross-checks the amount against what's actually stored in
  the database (never trusting a number passed in from the client).
- **`book_slot()`** (in the migration file) — a Postgres function that
  atomically flips a slot to booked and creates the pending booking in
  one transaction, so two clients clicking the same slot at the same
  moment can't both succeed.
- Every table has Row Level Security policies scoped to `auth.uid()` —
  a client can only ever see/edit their own workout logs, body metrics,
  and bookings; a coach can only edit their own availability and see
  bookings where they're the coach.

## What's intentionally out of scope for this first version

- Coach payouts (Paystack collects the money into *your* Paystack
  balance; splitting it out to individual coaches would need Paystack's
  Subaccounts/Split Payment API, which is a real feature to add later
  but adds real complexity)
- Session cancellation/refunds
- Push/email notifications for booking confirmations
- File uploads for coach profile photos (using an emoji avatar keeps
  this free-tier-only, with no Supabase Storage costs)

None of these are hard to add later — the architecture (real DB, real
RLS, real payment verification) is built to extend, not to throw away.
