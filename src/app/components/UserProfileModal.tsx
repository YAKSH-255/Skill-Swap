import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Zap, Trophy, Send, Repeat2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSwaps } from '@/hooks/useSwaps';
import { useSkills } from '@/hooks/useDiscovery';
import type { Profile, UserSkill } from '@/types/database';
import { toast } from 'sonner';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

export function hashColor(str: string): string {
  const colors = ['#5D7052', '#C18C5D', '#8B7355', '#7B8FA1', '#A87D6B', '#6B8E6B', '#9B8260', '#7A6E9C'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getTitle(totalXp: number): { name: string; emoji: string; color: string } {
  if (totalXp >= 100000) return { name: 'Legendary Sage', emoji: '🌟', color: '#D4AF37' };
  if (totalXp >= 50000)  return { name: 'Grand Master', emoji: '🏆', color: '#C0872F' };
  if (totalXp >= 25000)  return { name: 'Archmage', emoji: '🔮', color: '#9B59B6' };
  if (totalXp >= 10000)  return { name: 'Champion', emoji: '⚔️', color: '#E74C3C' };
  if (totalXp >= 5000)   return { name: 'Expert', emoji: '💎', color: '#2980B9' };
  if (totalXp >= 2000)   return { name: 'Adept', emoji: '🌿', color: '#27AE60' };
  if (totalXp >= 1000)   return { name: 'Scholar', emoji: '📚', color: '#5D7052' };
  if (totalXp >= 500)    return { name: 'Apprentice', emoji: '🎓', color: '#C18C5D' };
  if (totalXp >= 100)    return { name: 'Initiate', emoji: '✨', color: '#78786C' };
  return { name: 'Novice', emoji: '🌱', color: '#9BA89A' };
}

type FullProfile = Profile & {
  user_skills?: (UserSkill & { skills?: { name: string; category: string } })[];
};

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { user } = useAuth();
  const { createSwap } = useSwaps(user?.id);
  const { skills } = useSkills();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerSkill, setOfferSkill] = useState('');
  const [wantSkill, setWantSkill] = useState('');
  const [message, setMessage] = useState('');
  const [showProposal, setShowProposal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*, user_skills(*, skills(name, category))')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as FullProfile);
        setLoading(false);
      });
  }, [userId]);

  const handlePropose = async () => {
    if (!offerSkill || !wantSkill) return;
    setSending(true);
    const { error } = await createSwap(userId, offerSkill, wantSkill, message);
    setSending(false);
    if (!error) {
      toast.success('Swap proposal sent! 🎉');
      onClose();
    } else {
      toast.error('Failed to send proposal. Please try again.');
    }
  };

  const totalXp = (profile?.learner_xp ?? 0) + (profile?.teacher_xp ?? 0);
  const title = getTitle(totalXp);
  const avatarColor = hashColor(profile?.full_name ?? userId);
  const teachSkills = profile?.user_skills?.filter((us) => us.skill_type === 'teach') ?? [];
  const learnSkills = profile?.user_skills?.filter((us) => us.skill_type === 'learn') ?? [];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(44,44,36,0.55)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: O.card, boxShadow: '0 24px 64px -12px rgba(44,44,36,0.3)' }}
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
      >
        {/* Header Banner */}
        <div
          className="relative p-6 pb-5"
          style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.22)', border: 'none', cursor: 'pointer', color: '#fff' }}
          >
            <X size={16} />
          </button>

          <div className="flex items-end gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white overflow-hidden shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.35)' }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span style={{ fontSize: 28, fontWeight: 900 }}>{initials(profile?.full_name)}</span>
              }
            </div>
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: '#fff' }}>
                  {loading ? '...' : (profile?.full_name || 'Unknown User')}
                </h3>
                {profile?.verified_mentor && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700 }}>
                    <Shield size={10} /> Verified
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                {title.emoji} {title.name}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[62vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 py-2">
              {[80, 65, 50].map((w, i) => (
                <div key={i} className="h-4 rounded-full animate-pulse" style={{ background: O.muted, width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: Zap,    label: 'Learner XP', value: (profile?.learner_xp ?? 0).toLocaleString(), color: O.primary },
                  { icon: Trophy, label: 'Teacher XP', value: (profile?.teacher_xp ?? 0).toLocaleString(), color: O.secondary },
                  { icon: Star,   label: 'Reputation', value: Number(profile?.reputation_score ?? 50).toFixed(1), color: '#8B7355' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-2xl" style={{ background: O.muted }}>
                    <Icon size={15} style={{ color, margin: '0 auto 5px' }} />
                    <p style={{ fontSize: 16, fontWeight: 800, color: O.fg, fontFamily: "'Fraunces', serif" }}>{value}</p>
                    <p style={{ fontSize: 10, color: O.mutedFg, fontWeight: 700 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p style={{ fontSize: 14, color: O.mutedFg, lineHeight: 1.75 }}>{profile.bio}</p>
              )}

              {/* Teach Skills */}
              {teachSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: O.mutedFg, letterSpacing: '0.07em' }}>🎓 TEACHES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teachSkills.map((us) => (
                      <span key={us.id} className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: `${O.primary}15`, color: O.primary, fontWeight: 700, border: `1px solid ${O.primary}25` }}>
                        {us.skills?.name ?? '?'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Learn Skills */}
              {learnSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: O.mutedFg, letterSpacing: '0.07em' }}>📖 WANTS TO LEARN</p>
                  <div className="flex flex-wrap gap-1.5">
                    {learnSkills.map((us) => (
                      <span key={us.id} className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: `${O.secondary}15`, color: O.secondary, fontWeight: 700, border: `1px solid ${O.secondary}25` }}>
                        {us.skills?.name ?? '?'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA — only show for other users */}
              {user?.id !== userId && (
                <AnimatePresence mode="wait">
                  {showProposal ? (
                    <motion.div
                      key="proposal"
                      className="space-y-3 p-4 rounded-2xl"
                      style={{ background: `${O.primary}08`, border: `1px solid ${O.primary}22` }}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <p className="text-sm font-bold" style={{ color: O.primary }}>Send Swap Proposal</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={offerSkill} onChange={(e) => setOfferSkill(e.target.value)}
                          className="px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                        >
                          <option value="">You teach...</option>
                          {skills.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <select
                          value={wantSkill} onChange={(e) => setWantSkill(e.target.value)}
                          className="px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                        >
                          <option value="">You learn...</option>
                          {skills.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <textarea
                        placeholder="Intro message (optional)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                        style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handlePropose}
                          disabled={sending || !offerSkill || !wantSkill}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm"
                          style={{
                            background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer',
                            opacity: !offerSkill || !wantSkill ? 0.5 : 1,
                          }}
                        >
                          <Send size={14} /> {sending ? 'Sending...' : 'Send Proposal'}
                        </button>
                        <button
                          onClick={() => setShowProposal(false)}
                          className="px-4 py-2.5 rounded-xl text-sm"
                          style={{ background: O.muted, border: `1px solid ${O.border}`, cursor: 'pointer', color: O.mutedFg }}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="propose-btn"
                      onClick={() => setShowProposal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm"
                      style={{ background: O.primary, fontWeight: 800, border: 'none', cursor: 'pointer' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    >
                      <Repeat2 size={16} /> Propose Swap
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
