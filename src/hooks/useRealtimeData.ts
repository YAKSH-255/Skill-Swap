import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UseRealtimeOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
}

export function useRealtimeData<T>(
  table: string,
  onData?: (data: T) => void,
  options: UseRealtimeOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { event = '*', schema = 'public' } = options;

  const subscribe = useCallback(() => {
    setLoading(true);
    setError(null);

    const channel: RealtimeChannel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
        },
        (payload) => {
          console.log(`Real-time update from ${table}:`, payload);
          
          if (payload.eventType === 'INSERT') {
            setData((prev) => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === (payload.new as any).id ? (payload.new as T) : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item: any) => item.id !== (payload.old as any).id)
            );
          }

          if (onData) {
            onData(payload.new as T);
          }
        }
      )
      .subscribe(
        (status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${table} changes`);
            setLoading(false);
          } else if (status === 'CLOSED') {
            console.log(`Closed subscription to ${table}`);
          }
        },
        (error) => {
          console.error(`Subscription error for ${table}:`, error);
          setError(error as Error);
          setLoading(false);
        }
      );

    return channel;
  }, [table, event, schema, onData]);

  useEffect(() => {
    const channel = subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscribe]);

  return { data, loading, error };
}

export function useRealtimeMessages(userId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id=eq.${userId},receiver_id=eq.${userId})`,
        },
        (payload) => {
          setMessages((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setLoading(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { messages, loading };
}

export function useRealtimeSessions(userId: string) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const channel = supabase
      .channel(`sessions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `or(host_id=eq.${userId},guest_id=eq.${userId})`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSessions((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSessions((prev) =>
              prev.map((session) =>
                session.id === payload.new.id ? payload.new : session
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSessions((prev) =>
              prev.filter((session) => session.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setLoading(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { sessions, loading };
}

export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setLoading(true);

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          if (!payload.new.read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setLoading(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, loading, unreadCount };
}

export function useRealtimeSwaps(userId: string) {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const channel = supabase
      .channel(`swaps:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swap_proposals',
          filter: `or(from_user_id=eq.${userId},to_user_id=eq.${userId})`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSwaps((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSwaps((prev) =>
              prev.map((swap) =>
                swap.id === payload.new.id ? payload.new : swap
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSwaps((prev) =>
              prev.filter((swap) => swap.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setLoading(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { swaps, loading };
}
