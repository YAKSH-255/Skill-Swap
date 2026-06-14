import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Repeat2, Zap, Star, Send } from 'lucide-react';
import { useSwaps } from '@/hooks/useSwaps';
import { useAuth } from '@/contexts/AuthContext';
import type { SwapProposal } from '@/types/database';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

interface SwapsPanelProps {
  onScheduleSession?: (swap: SwapProposal, partnerId: string) => void;
}

export function SwapsPanel({ onScheduleSession }: SwapsPanelProps) {
  const { user } = useAuth();
  const { swaps, loading, updateSwapStatus, createSwap } = useSwaps(user?.id);
  const [showNew, setShowNew] = useState(false);
  const [toUserId, setToUserId] = useState('');
  const [offerSkill, setOfferSkill] = useState('');
  const [wantSkill, setWantSkill] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const incoming = swaps.filter((s) => s.to_user_id === user?.id);
  const outgoing = swaps.filter((s) => s.from_user_id === user?.id);
  const pendingCount = incoming.filter((s) => s.status === 'pending').length;

  const handleCreate = async () => {
    if (!toUserId || !offerSkill || !wantSkill) return;
    setSubmitting(true);
    const { error } = await createSwap(toUserId, offerSkill, wantSkill, message);
    setSubmitting(false);
    if (!error) {
      setShowNew(false);
      setToUserId(''); setOfferSkill(''); setWantSkill(''); setMessage('');
    }
  };

  if (loading) {
    return <p style={{ color: O.mutedFg, padding: 20 }}>Loading swaps...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg }}>Skill Swaps</h3>
          <p style={{ fontSize: 13, color: O.mutedFg }}>{pendingCount} pending requests</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          <Send size={14} /> New Proposal
        </button>
      </div>

      {showNew && (
        <motion.div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: O.muted, border: `1px solid ${O.border}` }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <input placeholder="Partner User ID" value={toUserId} onChange={(e) => setToUserId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: `1px solid ${O.border}`, background: O.card }} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="You teach..." value={offerSkill} onChange={(e) => setOfferSkill(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${O.border}`, background: O.card }} />
            <input placeholder="You learn..." value={wantSkill} onChange={(e) => setWantSkill(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${O.border}`, background: O.card }} />
          </div>
          <textarea placeholder="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" rows={2}
            style={{ border: `1px solid ${O.border}`, background: O.card }} />
          <button onClick={handleCreate} disabled={submitting}
            className="w-full py-2 rounded-xl text-sm text-white"
            style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
            Send Proposal
          </button>
        </motion.div>
      )}

      {[...incoming, ...outgoing].length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: O.muted }}>
          <Repeat2 size={32} style={{ color: O.mutedFg, margin: '0 auto 12px' }} />
          <p style={{ color: O.mutedFg }}>No swap proposals yet. Discover mentors and send your first proposal!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...incoming, ...outgoing].map((req) => {
            const isIncoming = req.to_user_id === user?.id;
            const partner = isIncoming ? req.from_profile : req.to_profile;
            const partnerName = partner?.full_name ?? 'Unknown';
            const partnerId = isIncoming ? req.from_user_id : req.to_user_id;

            return (
              <motion.div key={req.id} className="p-4 rounded-2xl"
                style={{
                  background: req.status === 'accepted' ? `${O.primary}0c` : O.muted,
                  border: `1px solid ${req.status === 'accepted' ? O.primary + '30' : O.border}`,
                }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                    style={{ background: O.primary, fontWeight: 800 }}>
                    {initials(partnerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p style={{ fontSize: 14, fontWeight: 700, color: O.fg }}>{partnerName}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ background: `${O.secondary}18`, color: O.secondary, fontWeight: 600 }}>
                        {req.status}
                      </span>
                      {isIncoming && <span className="text-xs" style={{ color: O.mutedFg }}>incoming</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${O.primary}14`, color: O.primary, fontWeight: 600 }}>
                        <Zap size={10} /> {req.offer_skill}
                      </span>
                      <Repeat2 size={12} style={{ color: O.mutedFg }} />
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${O.secondary}14`, color: O.secondary, fontWeight: 600 }}>
                        <Star size={10} /> {req.want_skill}
                      </span>
                    </div>
                    {req.message && <p className="text-xs mt-2" style={{ color: O.mutedFg }}>{req.message}</p>}
                  </div>
                  {isIncoming && req.status === 'pending' && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => updateSwapStatus(req.id, 'accepted')}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: `${O.primary}18`, color: O.primary, border: 'none', cursor: 'pointer' }}>
                        <CheckCircle2 size={15} />
                      </button>
                      <button onClick={() => updateSwapStatus(req.id, 'declined')}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: '#A8544812', color: '#A85448', border: 'none', cursor: 'pointer' }}>
                        <XCircle size={15} />
                      </button>
                    </div>
                  )}
                  {req.status === 'accepted' && onScheduleSession && (
                    <button onClick={() => onScheduleSession(req, partnerId)}
                      className="text-xs px-3 py-1.5 rounded-full shrink-0"
                      style={{ background: O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      Schedule Session
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
