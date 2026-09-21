-- FitTrack schema
-- Run this in your Supabase project's SQL editor (or via the Supabase CLI:
-- `supabase db push`) once, after creating a free Supabase project.

-- ---------- profiles ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('client', 'coach')),
  avatar_emoji text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by any signed-in user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- ---------- coach_profiles ----------
create table if not exists coach_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  specialty text not null,
  bio text not null default '',
  hourly_rate_kobo integer not null check (hourly_rate_kobo >= 0),
  years_experience integer not null default 0
);

alter table coach_profiles enable row level security;

create policy "coach profiles are readable by any signed-in user"
  on coach_profiles for select
  to authenticated
  using (true);

create policy "a coach can insert their own coach profile"
  on coach_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "a coach can update their own coach profile"
  on coach_profiles for update
  to authenticated
  using (auth.uid() = id);

-- ---------- availability_slots ----------
create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coach_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table availability_slots enable row level security;

create policy "slots are readable by any signed-in user"
  on availability_slots for select
  to authenticated
  using (true);

create policy "a coach can insert their own slots"
  on availability_slots for insert
  to authenticated
  with check (auth.uid() = coach_id);

create policy "a coach can delete their own unbooked slots"
  on availability_slots for delete
  to authenticated
  using (auth.uid() = coach_id and is_booked = false);

-- Note: there is deliberately no client-facing UPDATE policy on
-- availability_slots. Slots are only ever flipped to booked via the
-- book_slot() function below (security definer), so a client can never
-- mark a slot booked without going through the real booking flow.

-- ---------- bookings ----------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references availability_slots(id),
  client_id uuid not null references profiles(id),
  coach_id uuid not null references coach_profiles(id),
  amount_kobo integer not null check (amount_kobo >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled')),
  payment_reference text,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;

create policy "clients and coaches can read their own bookings"
  on bookings for select
  to authenticated
  using (auth.uid() = client_id or auth.uid() = coach_id);

-- No direct INSERT/UPDATE policy for regular users: bookings are only
-- ever created via book_slot() and only ever confirmed via the
-- verify-payment Edge Function (which uses the service role key and so
-- bypasses RLS entirely). This is what stops someone from calling the
-- REST API directly to mark their own booking "confirmed" for free.

-- ---------- workout_logs ----------
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  logged_at date not null default current_date,
  exercise_name text not null,
  sets integer,
  reps integer,
  weight_kg numeric,
  duration_minutes integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table workout_logs enable row level security;

create policy "a client can manage their own workout logs"
  on workout_logs for all
  to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- ---------- body_metrics ----------
create table if not exists body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  recorded_at date not null default current_date,
  weight_kg numeric not null,
  created_at timestamptz not null default now(),
  unique (client_id, recorded_at)
);

alter table body_metrics enable row level security;

create policy "a client can manage their own body metrics"
  on body_metrics for all
  to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- ---------- book_slot(): atomic "claim slot + create booking" ----------
-- security definer so it can update availability_slots even though
-- regular users have no UPDATE policy on that table. It re-checks
-- is_booked itself, so two simultaneous callers can't both win the
-- same slot (the UPDATE ... WHERE is_booked = false only ever affects
-- one row across concurrent transactions).
create or replace function book_slot(p_slot_id uuid, p_amount_kobo integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid;
  v_booking_id uuid;
begin
  update availability_slots
    set is_booked = true
    where id = p_slot_id and is_booked = false
    returning coach_id into v_coach_id;

  if v_coach_id is null then
    raise exception 'Slot is no longer available';
  end if;

  insert into bookings (slot_id, client_id, coach_id, amount_kobo, status)
    values (p_slot_id, auth.uid(), v_coach_id, p_amount_kobo, 'pending_payment')
    returning id into v_booking_id;

  return v_booking_id;
end;
$$;

grant execute on function book_slot(uuid, integer) to authenticated;

-- ---------- auto-create profile rows on signup ----------
-- Supabase projects require email confirmation by default, which means
-- there is no active session (and so no authenticated auth.uid()) in the
-- moment right after supabase.auth.signUp() resolves — a client-side
-- insert into `profiles` at that point would be silently blocked by RLS.
-- A trigger on auth.users runs as the table owner and sees the metadata
-- passed via signUp()'s `options.data`, so it can create the profile
-- (and coach_profiles) row regardless of confirmation state.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'client');

  insert into public.profiles (id, full_name, role, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New user'),
    v_role,
    new.raw_user_meta_data->>'avatar_emoji'
  );

  if v_role = 'coach' then
    insert into public.coach_profiles (id, specialty, bio, hourly_rate_kobo, years_experience)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'specialty', ''),
      coalesce(new.raw_user_meta_data->>'bio', ''),
      coalesce((new.raw_user_meta_data->>'hourly_rate_kobo')::integer, 0),
      coalesce((new.raw_user_meta_data->>'years_experience')::integer, 0)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
