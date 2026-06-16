import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/types/database';

export function useSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!userId) { setSessions([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        host_profile:profiles!sessions_host_id_fkey(id, full_name, avatar_url),
        guest_profile:profiles!sessions_guest_id_fkey(id, full_name, avatar_url)
      `)
      .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
      .order('scheduled_at', { ascending: true });

    if (!error && data) setSessions(data as Session[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`sessions-realtime:${userId}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => fetchSessions(),
      )
      .subscribe((status) => {
        console.log(`Sessions realtime status for ${userId}:`, status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchSessions]);

  const createSession = async (params: {
    swapId?: string;
    guestId: string;
    title: string;
    scheduledAt: string;
    durationMinutes?: number;
  }) => {
    if (!userId) return { error: 'Not authenticated', session: null };

    const jitsiRoom = `skillswap-${crypto.randomUUID()}`;
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        swap_id: params.swapId ?? null,
        host_id: userId,
        guest_id: params.guestId,
        title: params.title,
        scheduled_at: params.scheduledAt,
        duration_minutes: params.durationMinutes ?? 60,
        jitsi_room: jitsiRoom,
      })
      .select()
      .single();

    return { error: error?.message ?? null, session: data as Session | null };
  };

  const updateSessionStatus = async (sessionId: string, status: Session['status']) => {
    const { error } = await supabase
      .from('sessions')
      .update({ status })
      .eq('id', sessionId);
    return { error: error?.message ?? null };
  };

  return { sessions, loading, createSession, updateSessionStatus, refetch: fetchSessions };
}
