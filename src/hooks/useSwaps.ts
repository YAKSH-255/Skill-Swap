import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SwapProposal } from '@/types/database';

export function useSwaps(userId: string | undefined) {
  const [swaps, setSwaps] = useState<SwapProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSwaps = useCallback(async () => {
    if (!userId) { setSwaps([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from('swap_proposals')
      .select(`
        *,
        from_profile:profiles!swap_proposals_from_user_id_fkey(id, full_name, avatar_url, reputation_score),
        to_profile:profiles!swap_proposals_to_user_id_fkey(id, full_name, avatar_url, reputation_score)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!error && data) setSwaps(data as SwapProposal[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`swaps-realtime:${userId}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'swap_proposals' },
        () => fetchSwaps(),
      )
      .subscribe((status) => {
        console.log(`Swaps realtime status for ${userId}:`, status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchSwaps]);

  const createSwap = async (toUserId: string, offerSkill: string, wantSkill: string, message = '') => {
    if (!userId) return { error: 'Not authenticated' };

    // Prevent self-swap
    if (toUserId === userId) return { error: 'You cannot swap with yourself.' };

    // Prevent duplicate pending proposals to the same user
    const { data: existing } = await supabase
      .from('swap_proposals')
      .select('id')
      .eq('from_user_id', userId)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending')
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: 'You already have a pending proposal with this user.' };
    }

    const { error } = await supabase.from('swap_proposals').insert({
      from_user_id: userId,
      to_user_id: toUserId,
      offer_skill: offerSkill,
      want_skill: wantSkill,
      message,
    });
    return { error: error?.message ?? null };
  };

  const updateSwapStatus = async (swapId: string, status: 'accepted' | 'declined' | 'completed') => {
    const { error } = await supabase
      .from('swap_proposals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', swapId);
    return { error: error?.message ?? null };
  };

  // Sender withdraws their own pending proposal
  const withdrawSwap = async (swapId: string) => {
    if (!userId) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('swap_proposals')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', swapId)
      .eq('from_user_id', userId)
      .eq('status', 'pending');
    return { error: error?.message ?? null };
  };

  return { swaps, loading, createSwap, updateSwapStatus, withdrawSwap, refetch: fetchSwaps };
}
