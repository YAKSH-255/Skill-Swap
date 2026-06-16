import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useDiscovery, useSkills } from '@/hooks/useDiscovery';
import { useSwaps } from '@/hooks/useSwaps';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileModal, hashColor } from '../UserProfileModal';
import { toast } from 'sonner';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

const shadowSoft = '0 4px 20px -2px rgba(93,112,82,0.12)';

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const CATEGORIES = [
  'All', 'Technology', 'Languages', 'Arts and Creative Skills',
  'Music and Performance', 'Business and Finance', 'Wellness and Lifestyle',
  'Academic Subjects', 'Life Skills',
];

const SORT_OPTIONS = [
  { value: 'reputation', label: 'Top Rated' },
  { value: 'xp', label: 'Most XP' },
  { value: 'name', label: 'Name A–Z' },
];

function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl animate-pulse" style={{ background: O.card, border: `1px solid ${O.border}`, boxShadow: shadowSoft }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full shrink-0" style={{ background: O.muted }} />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 rounded-full" style={{ background: O.muted, width: '60%' }} />
          <div className="h-3 rounded-full" style={{ background: O.muted, width: '40%' }} />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 rounded-full" style={{ background: O.muted, width: 64 }} />
        ))}
      </div>
      <div className="h-9 rounded-xl" style={{ background: O.muted }} />
    </div>
  );
}

export function DiscoveryPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'reputation' | 'xp' | 'name'>('reputation');
  const [showFilters, setShowFilters] = useState(false);
  const [offerSkill, setOfferSkill] = useState('');
  const [wantSkill, setWantSkill] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const { profiles, loading } = useDiscovery(user?.id, search);
  const { skills } = useSkills();
  const { createSwap } = useSwaps(user?.id);

  // Filter by category
  const filtered = profiles.filter((p) => {
    if (category === 'All') return true;
    return p.user_skills?.some(
      (us) => (us as typeof us & { skills?: { category: string } }).skills?.category === category
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'xp') return (b.learner_xp + b.teacher_xp) - (a.learner_xp + a.teacher_xp);
    if (sortBy === 'name') return (a.full_name ?? '').localeCompare(b.full_name ?? '');
    return Number(b.reputation_score) - Number(a.reputation_score);
  });

  const handlePropose = async (toUserId: string) => {
    if (!offerSkill || !wantSkill) {
      setTargetId(toUserId);
      return;
    }
    setSending(true);
    const { error } = await createSwap(toUserId, offerSkill, wantSkill, message);
    setSending(false);
    if (!error) {
      toast.success('Swap proposal sent! 🎉');
      setTargetId(null);
      setOfferSkill(''); setWantSkill(''); setMessage('');
    } else {
      toast.error('Failed to send proposal.');
    }
  };

  return (
    <>
      {viewProfileId && (
        <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 20 }}>Discover Mentors</h3>
            <p style={{ fontSize: 13, color: O.mutedFg }}>
              Find swap partners by skill — {loading ? '...' : `${sorted.length} result${sorted.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              background: showFilters ? O.primary : O.muted,
              color: showFilters ? '#fff' : O.mutedFg,
              border: `1px solid ${showFilters ? O.primary : O.border}`,
              fontWeight: 700, cursor: 'pointer',
            }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          >
            <SlidersHorizontal size={14} /> Filters
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={O.mutedFg} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </span>
          <input
            placeholder="Search by name, skill, or bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full text-sm outline-none"
            style={{ border: `1px solid ${search ? O.primary + '60' : O.border}`, background: O.card }}
          />
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="p-4 rounded-2xl space-y-4"
              style={{ background: O.card, border: `1px solid ${O.border}` }}
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            >
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: O.mutedFg, letterSpacing: '0.06em' }}>CATEGORY</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{
                        background: category === cat ? O.primary : O.muted,
                        color: category === cat ? '#fff' : O.mutedFg,
                        border: `1px solid ${category === cat ? O.primary : O.border}`,
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: O.mutedFg, letterSpacing: '0.06em' }}>SORT BY</p>
                <div className="flex gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value as typeof sortBy)}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{
                        background: sortBy === opt.value ? O.secondary : O.muted,
                        color: sortBy === opt.value ? '#fff' : O.mutedFg,
                        border: `1px solid ${sortBy === opt.value ? O.secondary : O.border}`,
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proposal quick form */}
        <AnimatePresence>
          {targetId && (
            <motion.div
              className="p-4 rounded-2xl space-y-3"
              style={{ background: `${O.primary}08`, border: `1px solid ${O.primary}28` }}
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            >
              <p className="text-sm font-bold" style={{ color: O.primary }}>
                Send Swap Proposal to{' '}
                <span style={{ color: O.fg }}>
                  {profiles.find((p) => p.id === targetId)?.full_name ?? 'partner'}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={offerSkill} onChange={(e) => setOfferSkill(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                >
                  <option value="">You teach...</option>
                  <option value="None">None (Request Mentorship)</option>
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
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                rows={2}
                style={{ border: `1px solid ${O.border}`, background: O.card }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handlePropose(targetId)}
                  disabled={sending || !offerSkill || !wantSkill}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: !offerSkill || !wantSkill ? 0.5 : 1 }}
                >
                  <Send size={14} /> {sending ? 'Sending...' : 'Send Proposal'}
                </button>
                <button
                  onClick={() => { setTargetId(null); setOfferSkill(''); setWantSkill(''); setMessage(''); }}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: O.muted, border: `1px solid ${O.border}`, cursor: 'pointer', color: O.mutedFg }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            className="text-center py-16 rounded-2xl"
            style={{ background: O.muted }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <Users size={36} style={{ color: O.mutedFg, margin: '0 auto 14px' }} />
            <p style={{ color: O.mutedFg, fontWeight: 600 }}>No users found.</p>
            <p className="text-sm mt-1" style={{ color: O.mutedFg }}>
              Try a different search or category filter.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((p, i) => {
              const teachSkills = p.user_skills?.filter((us) => us.skill_type === 'teach') ?? [];
              const learnSkills = p.user_skills?.filter((us) => us.skill_type === 'learn') ?? [];
              const avatarColor = hashColor(p.full_name ?? '');
              const totalXp = p.learner_xp + p.teacher_xp;

              return (
                <motion.div
                  key={p.id}
                  className="p-5 rounded-2xl"
                  style={{ background: O.card, border: `1px solid ${O.border}`, boxShadow: shadowSoft }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 30px -8px rgba(93,112,82,0.18)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <button
                      onClick={() => setViewProfileId(p.id)}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm text-white shrink-0 overflow-hidden"
                      style={{ background: avatarColor, fontWeight: 900, border: 'none', cursor: 'pointer' }}
                    >
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span style={{ fontSize: 15, fontWeight: 900 }}>{initials(p.full_name)}</span>
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setViewProfileId(p.id)}
                          style={{ fontWeight: 700, color: O.fg, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Fraunces', serif", fontSize: 15 }}
                        >
                          {p.full_name}
                        </button>
                        {p.verified_mentor && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${O.secondary}18`, color: O.secondary, fontWeight: 700 }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: O.mutedFg }}>
                        ⭐ {Number(p.reputation_score).toFixed(1)} · {totalXp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>

                  {p.bio && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: O.mutedFg, lineHeight: 1.6 }}>
                      {p.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {teachSkills.slice(0, 3).map((us) => (
                      <span key={us.id} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${O.primary}14`, color: O.primary, fontWeight: 700 }}>
                        🎓 {(us as typeof us & { skills?: { name: string } }).skills?.name ?? '?'}
                      </span>
                    ))}
                    {learnSkills.slice(0, 2).map((us) => (
                      <span key={us.id} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${O.secondary}14`, color: O.secondary, fontWeight: 700 }}>
                        📖 {(us as typeof us & { skills?: { name: string } }).skills?.name ?? '?'}
                      </span>
                    ))}
                  </div>

                  <motion.button
                    onClick={() => { setTargetId(p.id); setOfferSkill(''); setWantSkill(''); }}
                    className="w-full py-2.5 rounded-xl text-sm text-white"
                    style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    Propose Swap
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
