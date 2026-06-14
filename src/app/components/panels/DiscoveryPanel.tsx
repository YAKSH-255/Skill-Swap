import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Star, Send, Users } from 'lucide-react';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useSwaps } from '@/hooks/useSwaps';
import { useAuth } from '@/contexts/AuthContext';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export function DiscoveryPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [offerSkill, setOfferSkill] = useState('');
  const [wantSkill, setWantSkill] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { profiles, loading } = useDiscovery(user?.id, search);
  const { createSwap } = useSwaps(user?.id);

  const handlePropose = async (toUserId: string) => {
    if (!offerSkill || !wantSkill) {
      setTargetId(toUserId);
      return;
    }
    await createSwap(toUserId, offerSkill, wantSkill, message);
    setTargetId(null);
    setOfferSkill('');
    setWantSkill('');
    setMessage('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg }}>Discover Mentors</h3>
        <p style={{ fontSize: 13, color: O.mutedFg }}>Find swap partners by skill — live from database</p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: O.mutedFg }} />
        <input placeholder="Search by name, skill, or bio..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-full text-sm outline-none"
          style={{ border: `1px solid ${search ? O.primary + '60' : O.border}`, background: O.card }} />
      </div>

      {targetId && (
        <motion.div className="p-4 rounded-2xl space-y-3"
          style={{ background: `${O.primary}10`, border: `1px solid ${O.primary}30` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <p className="text-sm font-semibold" style={{ color: O.primary }}>Send swap proposal</p>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="You teach..." value={offerSkill} onChange={(e) => setOfferSkill(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${O.border}`, background: O.card }} />
            <input placeholder="You learn..." value={wantSkill} onChange={(e) => setWantSkill(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${O.border}`, background: O.card }} />
          </div>
          <textarea placeholder="Intro message" value={message} onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" rows={2}
            style={{ border: `1px solid ${O.border}`, background: O.card }} />
          <div className="flex gap-2">
            <button onClick={() => handlePropose(targetId)}
              className="flex-1 py-2 rounded-xl text-sm text-white flex items-center justify-center gap-2"
              style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              <Send size={14} /> Send Proposal
            </button>
            <button onClick={() => setTargetId(null)}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: O.muted, border: `1px solid ${O.border}`, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <p style={{ color: O.mutedFg, padding: 20 }}>Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: O.muted }}>
          <Users size={32} style={{ color: O.mutedFg, margin: '0 auto 12px' }} />
          <p style={{ color: O.mutedFg }}>No users found. Sign up with another account to start swapping!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((p) => {
            const teachSkills = p.user_skills?.filter((us) => us.skill_type === 'teach') ?? [];
            const learnSkills = p.user_skills?.filter((us) => us.skill_type === 'learn') ?? [];

            return (
              <motion.div key={p.id} className="p-5 rounded-2xl"
                style={{ background: O.card, border: `1px solid ${O.border}`, boxShadow: '0 4px 20px -2px rgba(93,112,82,0.1)' }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm text-white shrink-0"
                    style={{ background: O.primary, fontWeight: 800 }}>
                    {initials(p.full_name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p style={{ fontWeight: 700, color: O.fg, fontFamily: "'Fraunces', serif" }}>{p.full_name}</p>
                      {p.verified_mentor && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${O.secondary}18`, color: O.secondary, fontWeight: 700 }}>
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: O.mutedFg }}>
                      <Star size={10} style={{ color: O.secondary }} />
                      {Number(p.reputation_score).toFixed(1)} · {p.learner_xp + p.teacher_xp} XP
                    </div>
                  </div>
                </div>
                {p.bio && <p className="text-sm mb-3" style={{ color: O.mutedFg }}>{p.bio}</p>}
                <div className="flex flex-wrap gap-1 mb-3">
                  {teachSkills.map((us) => (
                    <span key={us.id} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${O.primary}14`, color: O.primary, fontWeight: 600 }}>
                      Teaches: {(us as typeof us & { skills?: { name: string } }).skills?.name ?? '?'}
                    </span>
                  ))}
                  {learnSkills.map((us) => (
                    <span key={us.id} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${O.secondary}14`, color: O.secondary, fontWeight: 600 }}>
                      Learns: {(us as typeof us & { skills?: { name: string } }).skills?.name ?? '?'}
                    </span>
                  ))}
                </div>
                <button onClick={() => handlePropose(p.id)}
                  className="w-full py-2 rounded-xl text-sm text-white"
                  style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Propose Swap
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
