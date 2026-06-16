import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message, Profile } from '@/types/database';

export function useMessages(userId: string | undefined, partnerId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<{ partner: Profile; lastMessage: Message; unread: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch messages for a specific conversation ────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!userId) { setMessages([]); setLoading(false); return; }

    // Fix: when a partnerId is supplied, build a single .or() that covers both
    // directions exactly — avoids Supabase double-.or() conflict.
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: true });

    if (partnerId) {
      // Single OR clause covering both directions in one call
      query = query.or(
        `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`,
      );
    } else {
      query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (!error && data) setMessages(data as Message[]);
    setLoading(false);
  }, [userId, partnerId]);

  // ── Fetch conversation list (sidebar) ─────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        receiver_profile:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    const partnerMap = new Map<string, { partner: Profile; lastMessage: Message; unread: number }>();

    for (const msg of data as Message[]) {
      const isSender = msg.sender_id === userId;
      const partner = isSender
        ? (msg as Message & { receiver_profile?: Profile }).receiver_profile
        : msg.sender_profile;
      if (!partner) continue;

      if (!partnerMap.has(partner.id)) {
        partnerMap.set(partner.id, {
          partner,
          lastMessage: msg,
          unread: !isSender && !msg.read_at ? 1 : 0,
        });
      } else if (!isSender && !msg.read_at) {
        partnerMap.get(partner.id)!.unread++;
      }
    }

    setConversations(Array.from(partnerMap.values()));
  }, [userId]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages();
    if (!partnerId) fetchConversations();
  }, [fetchMessages, fetchConversations, partnerId]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-realtime:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
        fetchConversations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchMessages, fetchConversations]);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = async (receiverId: string, content: string, swapId?: string) => {
    if (!userId) return { error: 'Not authenticated' };
    if (receiverId === userId) return { error: 'You cannot message yourself.' };
    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: receiverId,
      content,
      swap_id: swapId ?? null,
    });
    return { error: error?.message ?? null };
  };

  // ── Mark a single message as read ─────────────────────────────────────────
  const markRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null);
  };

  return { messages, conversations, loading, sendMessage, markRead, refetch: fetchMessages };
}
