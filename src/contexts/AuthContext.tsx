import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session as AuthSession } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: AuthSession | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Realtime profile updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile:${user.id}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => setProfile(payload.new as Profile),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Step 1: Create auth user — the handle_new_user trigger auto-creates the profile row
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' };
      }

      // Step 2: Upsert to ensure full_name is set (trigger may have used email fallback)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authData.user.id,
            email,
            full_name: fullName,
            timezone: 'UTC',
            reputation_score: 50.00,
            learner_xp: 0,
            teacher_xp: 0,
            streak_days: 0,
            verified_mentor: false,
          },
          { onConflict: 'id', ignoreDuplicates: false },
        );

      if (upsertError) {
        // Non-fatal: trigger already created the profile, user can still log in
        console.warn('Profile upsert warning (non-fatal):', upsertError.message);
      }

      return { error: null };
    } catch (err) {
      console.error('Signup exception:', err);
      return { error: 'An unexpected error occurred during signup' };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
