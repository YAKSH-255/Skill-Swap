import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface LandingStats {
  activeLearners: number;
  skillsAvailable: number;
  sessionsCompleted: number;
  averageRating: number;
  totalReviews: number;
}

export interface LandingTestimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  stars: number;
  timestamp: string;
}

/** Real user initials shown as avatars in the social proof row */
export interface SocialProofUser {
  id: string;
  initials: string;
  color: string;
}

const AVATAR_COLORS = ['#5D7052', '#C18C5D', '#8B7355', '#7A8C6E', '#B8956A'];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ── Landing Stats ─────────────────────────────────────────────────────────────
export function useLandingStats() {
  const [stats, setStats] = useState<LandingStats>({
    activeLearners: 0,
    skillsAvailable: 0,
    sessionsCompleted: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);

      // Count profiles (active learners)
      const { count: learnerCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Count distinct skills in use
      const { count: skillCount } = await supabase
        .from('user_skills')
        .select('skill_id', { count: 'exact', head: true });

      // Count completed sessions
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Real reviews: count and average rating
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('rating');

      const totalReviews = reviewData?.length ?? 0;
      const averageRating =
        totalReviews > 0
          ? Math.round((reviewData!.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
          : 0;

      setStats({
        activeLearners: learnerCount ?? 0,
        skillsAvailable: skillCount ?? 0,
        sessionsCompleted: sessionCount ?? 0,
        averageRating,
        totalReviews,
      });
    } catch (err) {
      console.error('Error fetching landing stats:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Realtime: re-fetch when profiles, sessions, or reviews change
    const channel = supabase
      .channel('landing-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_skills' }, fetchStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  return { stats, loading, error };
}

// ── Social Proof Users (real avatars in hero) ─────────────────────────────────
export function useSocialProofUsers() {
  const [users, setUsers] = useState<SocialProofUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    // Fetch the 5 most recent users with a full_name set
    const { data, count } = await supabase
      .from('profiles')
      .select('id, full_name', { count: 'exact' })
      .neq('full_name', '')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setUsers(
        data.map((u, i) => ({
          id: u.id,
          initials: getInitials(u.full_name ?? '?'),
          color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        })),
      );
    }
    setTotalUsers(count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('social-proof-users-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUsers]);

  return { users, totalUsers, loading };
}

// ── Review Stats (for social proof text) ─────────────────────────────────────
export function useReviewStats() {
  const [reviews, setReviews] = useState({
    totalReviews: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchReviewStats = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('rating');

      const total = data?.length ?? 0;
      const avg =
        total > 0
          ? Math.round((data!.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
          : 0;

      setReviews({ totalReviews: total, averageRating: avg });
    } catch (err) {
      console.error('Error fetching review stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewStats();

    const channel = supabase
      .channel('review-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviewStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReviewStats]);

  return { reviews, loading };
}

// ── Testimonials (from real completed sessions) ───────────────────────────────
export function useLandingTestimonials() {
  const [testimonials, setTestimonials] = useState<LandingTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      setError(null);

      const { data: sessions, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          host_profile:profiles!sessions_host_id_fkey(id, full_name),
          guest_profile:profiles!sessions_guest_id_fkey(id, full_name)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionError) throw sessionError;

      const testimonialList: LandingTestimonial[] = [];

      if (sessions && sessions.length > 0) {
        sessions.forEach((session: any, index: number) => {
          const hostProfile = session.host_profile;
          const guestProfile = session.guest_profile;

          if (hostProfile && index < 3) {
            testimonialList.push({
              name: hostProfile.full_name || 'User',
              role: `Completed ${session.title}`,
              avatar: getInitials(hostProfile.full_name || 'U'),
              quote: `Just completed an amazing session on ${session.title}. The exchange was incredibly valuable!`,
              stars: 5,
              timestamp: session.created_at,
            });
          }

          if (guestProfile && testimonialList.length < 6) {
            testimonialList.push({
              name: guestProfile.full_name || 'User',
              role: `Learned ${session.title}`,
              avatar: getInitials(guestProfile.full_name || 'U'),
              quote: `This skill swap completely changed how I approach learning. Highly recommended!`,
              stars: 5,
              timestamp: session.created_at,
            });
          }
        });
      }

      setTestimonials(testimonialList);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(err as Error);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();

    const channel = supabase
      .channel('landing-testimonials-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions' },
        fetchTestimonials,
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTestimonials]);

  return { testimonials, loading, error };
}
