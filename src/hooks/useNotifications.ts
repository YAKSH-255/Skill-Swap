import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) { 
      setNotifications([]); 
      setLoading(false); 
      return; 
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { 
    fetchNotifications(); 
  }, [fetchNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}-realtime-${Math.random()}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => n.id === updatedNotification.id ? updatedNotification : n)
          );
          // Update unread count if notification was marked as read
          if (payload.old?.read === false && updatedNotification.read === true) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log(`Notifications channel status: ${status}`);
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [userId]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  };

  return {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}
