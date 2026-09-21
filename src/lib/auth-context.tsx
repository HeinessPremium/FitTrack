import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profile, Role } from "@/lib/types";

const AVATAR_EMOJIS = ["🏃", "🏋️", "🚴", "🥊", "🧘", "🏊", "⛹️", "🤸"];

interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  coach?: {
    specialty: string;
    bio: string;
    hourlyRateNaira: number;
    yearsExperience: number;
  };
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    input: SignUpInput
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data as Profile | null);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp({ email, password, fullName, role, coach }: SignUpInput) {
    const avatar_emoji =
      AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];

    // Metadata here is read by the handle_new_user() trigger (see the SQL
    // migration) to create the profiles/coach_profiles rows server-side —
    // this works even before the user confirms their email, when there's
    // no authenticated session yet for a client-side insert to use.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          avatar_emoji,
          ...(role === "coach" && coach
            ? {
                specialty: coach.specialty,
                bio: coach.bio,
                hourly_rate_kobo: Math.round(coach.hourlyRateNaira * 100),
                years_experience: coach.yearsExperience,
              }
            : {}),
        },
      },
    });

    if (error) return { error: error.message };

    if (!data.session) {
      // Email confirmation is required (Supabase's default) — there's no
      // active session yet, so there's nothing more to load right now.
      return {
        error: null,
        needsEmailConfirmation: true,
      };
    }

    if (data.user) await loadProfile(data.user.id);
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
