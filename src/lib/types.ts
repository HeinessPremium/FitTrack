export type Role = "client" | "coach";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  avatar_emoji: string | null;
  created_at: string;
}

export interface CoachProfile {
  id: string;
  specialty: string;
  bio: string;
  hourly_rate_kobo: number;
  years_experience: number;
}

export interface CoachWithProfile extends CoachProfile {
  profile: Profile;
}

export interface AvailabilitySlot {
  id: string;
  coach_id: string;
  starts_at: string;
  is_booked: boolean;
  created_at: string;
}

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  slot_id: string;
  client_id: string;
  coach_id: string;
  amount_kobo: number;
  status: BookingStatus;
  payment_reference: string | null;
  created_at: string;
}

export interface BookingWithDetails extends Booking {
  slot: AvailabilitySlot;
  coach: CoachWithProfile;
  client: Profile;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  logged_at: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface BodyMetric {
  id: string;
  client_id: string;
  recorded_at: string;
  weight_kg: number;
  created_at: string;
}
