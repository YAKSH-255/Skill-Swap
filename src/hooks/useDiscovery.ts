import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, UserSkill } from '@/types/database';

export function useDiscovery(excludeUserId?: string, searchQuery = '') {
  const [profiles, setProfiles] = useState<(Profile & { user_skills?: UserSkill[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_skills(*, skills(name, category))
      `)
      .order('reputation_score', { ascending: false })
      .limit(50);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;
    if (!error && data) {
      let filtered = data as (Profile & { user_skills?: UserSkill[] })[];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((p) =>
          (p.full_name || '').toLowerCase().includes(q) ||
          (p.bio || '').toLowerCase().includes(q) ||
          p.user_skills?.some((us) =>
            ((us as UserSkill & { skills?: { name: string } }).skills?.name || '').toLowerCase().includes(q),
          ),
        );
      }
      setProfiles(filtered);
    }
    setLoading(false);
  }, [excludeUserId, searchQuery]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  return { profiles, loading, refetch: fetchProfiles };
}

export function useLeaderboard() {
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('learner_xp', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error && data) setLeaders(data);
        setLoading(false);
      });

    const channel = supabase
      .channel(`leaderboard-realtime-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        async () => {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('learner_xp', { ascending: false })
            .limit(10);
          if (data) setLeaders(data);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { leaders, loading };
}

export function useSkills() {
  const [skills, setSkills] = useState<{ id: string; name: string; category: string }[]>([]);

  useEffect(() => {
    supabase.from('skills').select('*').order('category').then(({ data }) => {
      if (data) setSkills(data);
    });
  }, []);

  return { skills };
}
