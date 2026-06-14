import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CommunityRoom, RoomMessage } from '@/types/database';

export function useCommunityRooms() {
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_rooms')
      .select(`
        *,
        creator_profile:profiles!community_rooms_creator_id_fkey(id, full_name, avatar_url)
      `)
      .order('member_count', { ascending: false });

    if (!error && data) setRooms(data as CommunityRoom[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Realtime: update room list when rooms or member counts change
  useEffect(() => {
    const roomsChannel = supabase
      .channel(`community-rooms-realtime-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_rooms' },
        () => fetchRooms(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members' },
        () => fetchRooms(),
      )
      .subscribe((status) => {
        console.log('Community rooms realtime status:', status);
      });

    return () => { supabase.removeChannel(roomsChannel); };
  }, [fetchRooms]);

  const createRoom = async (userId: string, name: string, description: string, category: string) => {
    const { data, error } = await supabase
      .from('community_rooms')
      .insert({ name, description, category, creator_id: userId })
      .select()
      .single();

    if (!error && data) {
      await supabase.from('room_members').insert({ room_id: data.id, user_id: userId });
      await fetchRooms();
    }
    return { error: error?.message ?? null, room: data };
  };

  const joinRoom = async (roomId: string, userId: string) => {
    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: userId });
    return { error: error?.message ?? null };
  };

  return { rooms, loading, createRoom, joinRoom, refetch: fetchRooms };
}

export function useRoomChat(roomId: string | null) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!roomId) { setMessages([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from('room_messages')
      .select(`
        *,
        profile:profiles!room_messages_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) setMessages(data as RoomMessage[]);
    setLoading(false);
  }, [roomId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const newMsg = payload.new as RoomMessage;
          // Fetch the sender's profile for the new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, profile: profileData ?? undefined } as RoomMessage,
          ]);
        },
      )
      .subscribe((status) => {
        console.log(`Room chat ${roomId} realtime status:`, status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const sendMessage = async (userId: string, content: string) => {
    if (!roomId) return { error: 'No room selected' };
    const { error } = await supabase.from('room_messages').insert({
      room_id: roomId,
      user_id: userId,
      content,
    });
    return { error: error?.message ?? null };
  };

  return { messages, loading, sendMessage };
}
