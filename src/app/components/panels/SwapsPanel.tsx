import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Repeat2, Zap, Star, Search, ChevronDown } from 'lucide-react';
import { useSwaps } from '@/hooks/useSwaps';
import { useDiscovery, useSkills } from '@/hooks/useDiscovery';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileModal } from '../UserProfileModal';
import { hashColor } from '../UserProfileModal';
import type { SwapProposal } from '@/types/database';
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

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#C18C5D18', color: '#C18C5D' },
  accepted:  { bg: '#5D705218', color: '#5D7052' },
  declined:  { bg: '#A8544818', color: '#A85448' },
  completed: { bg: '#78786C18', color: '#78786C' },
};

interface SwapsPanelProps {
  onScheduleSession?: (swap: SwapProposal, partnerId: string) => void;
}

export function SwapsPanel({ onScheduleSession }: SwapsPanelProps) {
  const { user } = useAuth();
  const { swaps, loading, updateSwapStatus, createSwap, withdrawSwap } = useSwaps(user?.id);
  const { profiles } = useDiscovery(user?.id);
  const { skills } = useSkills();

  const [showNew, setShowNew] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
  const [offerSkill, setOfferSkill] = useState('');
  const [wantSkill, setWantSkill] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const incoming = swaps.filter((s) => s.to_user_id === user?.id);
  const outgoing = swaps.filter((s) => s.from_user_id === user?.id);
  const pendingCount = incoming.filter((s) => s.status === 'pending').length;

  const filteredPartners = profiles.filter((p) =>
    p.full_name?.toLowerCase().includes(partnerSearch.toLowerCase())
  );
  const selectedPartner = profiles.find((p) => p.id === selectedPartnerId);

  const handleCreate = async () => {
    if (!selectedPartnerId || !offerSkill || !wantSkill) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const { error } = await createSwap(selectedPartnerId, offerSkill, wantSkill, message);
    setSubmitting(false);
    if (!error) {
      toast.success('Swap proposal sent! 🎉');
      setShowNew(false);
      setSelectedPartnerId(''); setPartnerSearch('');
      setOfferSkill(''); setWantSkill(''); setMessage('');
    } else {
      toast.error(error || 'Failed to send proposal. Try again.');
    }
  };

  const handleAccept = async (id: string) => {
    await updateSwapStatus(id, 'accepted');
    toast.success('Swap accepted! Schedule a session to get started.');
  };

  const handleDecline = async (id: string) => {
    await updateSwapStatus(id, 'declined');
    toast.info('Swap declined.');
  };

  const handleWithdraw = async (id: string) => {
    const { error } = await withdrawSwap(id);
    if (!error) {
      toast.info('Proposal withdrawn.');
    } else {
      toast.error('Could not withdraw proposal.');
    }
  };

  const displayedSwaps = activeTab === 'incoming' ? incoming : outgoing;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-full animate-pulse" style={{ background: O.muted }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-2xl animate-pulse" style={{ background: O.muted, height: 88 }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {viewProfileId && (
        <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 20 }}>Skill Swaps</h3>
            <p style={{ fontSize: 13, color: O.mutedFg }}>
              {pendingCount > 0
                ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''} awaiting your response`
                : 'No pending requests'}
            </p>
          </div>
          <motion.button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"
            style={{ background: O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          >
            <Repeat2 size={15} /> New Proposal
          </motion.button>
        </div>

        {/* New Proposal Form */}
        <AnimatePresence>
          {showNew && (
            <motion.div
              className="p-5 rounded-2xl space-y-3"
              style={{ background: O.card, border: `1px solid ${O.primary}30`, boxShadow: shadowSoft }}
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            >
              <p className="text-sm font-bold" style={{ color: O.primary, fontFamily: "'Fraunces', serif" }}>
                New Swap Proposal
              </p>

              {/* Partner search */}
              <div className="relative">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
                  style={{ border: `1px solid ${selectedPartnerId ? O.primary + '60' : O.border}`, background: O.muted }}
                  onClick={() => setShowPartnerDropdown(!showPartnerDropdown)}
                >
                  {selectedPartner ? (
                    <>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                        style={{ background: hashColor(selectedPartner.full_name ?? ''), fontWeight: 800 }}>
                        {initials(selectedPartner.full_name)}
                      </div>
                      <span className="text-sm flex-1" style={{ color: O.fg, fontWeight: 600 }}>
                        {selectedPartner.full_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Search size={14} style={{ color: O.mutedFg }} />
                      <span className="text-sm flex-1" style={{ color: O.mutedFg }}>Search for a partner...</span>
                    </>
                  )}
                  <ChevronDown size={14} style={{ color: O.mutedFg }} />
                </div>

                <AnimatePresence>
                  {showPartnerDropdown && (
                    <motion.div
                      className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden"
                      style={{ background: O.card, border: `1px solid ${O.border}`, boxShadow: shadowSoft }}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="p-2">
                        <input
                          autoFocus
                          placeholder="Type a name..."
                          value={partnerSearch}
                          onChange={(e) => setPartnerSearch(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: `1px solid ${O.border}`, background: O.muted }}
                        />
                      </div>
                      <div className="max-h-44 overflow-y-auto">
                        {filteredPartners.length === 0 ? (
                          <p className="text-sm text-center py-4" style={{ color: O.mutedFg }}>No users found</p>
                        ) : (
                          filteredPartners.slice(0, 8).map((p) => (
                            <button
                              key={p.id}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:opacity-80"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${O.border}40` }}
                              onClick={() => {
                                setSelectedPartnerId(p.id);
                                setShowPartnerDropdown(false);
                                setPartnerSearch('');
                              }}
                            >
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                                style={{ background: hashColor(p.full_name ?? ''), fontWeight: 800 }}>
                                {initials(p.full_name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: O.fg }}>{p.full_name}</p>
                                <p className="text-xs" style={{ color: O.mutedFg }}>{p.learner_xp + p.teacher_xp} XP</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Skills */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={offerSkill}
                  onChange={(e) => setOfferSkill(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                >
                  <option value="">You teach...</option>
                  <option value="None">None (Request Mentorship)</option>
                  {skills.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <select
                  value={wantSkill}
                  onChange={(e) => setWantSkill(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                >
                  <option value="">You learn...</option>
                  {skills.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <textarea
                placeholder="Message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                rows={2}
                style={{ border: `1px solid ${O.border}`, background: O.card }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Sending...' : 'Send Proposal'}
                </button>
                <button
                  onClick={() => setShowNew(false)}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: O.muted, border: `1px solid ${O.border}`, cursor: 'pointer', color: O.mutedFg }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: O.muted }}>
          {([['incoming', `Incoming (${incoming.length})`], ['outgoing', `Outgoing (${outgoing.length})`]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-xl text-sm transition-all"
              style={{
                background: activeTab === tab ? O.primary : 'transparent',
                color: activeTab === tab ? '#fff' : O.mutedFg,
                fontWeight: activeTab === tab ? 700 : 600,
                border: 'none', cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Swap List */}
        {displayedSwaps.length === 0 ? (
          <motion.div
            className="text-center py-14 rounded-2xl"
            style={{ background: O.muted }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <Repeat2 size={32} style={{ color: O.mutedFg, margin: '0 auto 12px' }} />
            <p style={{ color: O.mutedFg, fontWeight: 600 }}>
              {activeTab === 'incoming' ? 'No incoming proposals yet.' : 'No outgoing proposals yet.'}
            </p>
            {activeTab === 'outgoing' && (
              <button
                onClick={() => setShowNew(true)}
                className="mt-3 px-4 py-2 rounded-full text-sm"
                style={{ background: O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Send your first proposal
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayedSwaps.map((req) => {
              const isIncoming = req.to_user_id === user?.id;
              const partner = isIncoming ? req.from_profile : req.to_profile;
              const partnerName = partner?.full_name ?? 'Unknown';
              const partnerId = isIncoming ? req.from_user_id : req.to_user_id;
              const statusStyle = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;

              return (
                <motion.div
                  key={req.id}
                  className="p-4 rounded-2xl"
                  style={{
                    background: req.status === 'accepted' ? `${O.primary}08` : O.card,
                    border: `1px solid ${req.status === 'accepted' ? O.primary + '25' : O.border}`,
                    boxShadow: shadowSoft,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar - clickable */}
                    <button
                      onClick={() => setViewProfileId(partnerId)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                      style={{ background: hashColor(partnerName), fontWeight: 800, border: 'none', cursor: 'pointer' }}
                    >
                      {partner?.avatar_url
                        ? <img src={partner.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        : initials(partnerName)
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <button
                          onClick={() => setViewProfileId(partnerId)}
                          style={{ fontSize: 14, fontWeight: 700, color: O.fg, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {partnerName}
                        </button>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{ background: statusStyle.bg, color: statusStyle.color, fontWeight: 700 }}
                        >
                          {req.status}
                        </span>
                        {isIncoming && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${O.secondary}15`, color: O.secondary, fontWeight: 600 }}>
                            incoming
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {req.offer_skill !== 'None' ? (
                          <>
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                              style={{ background: `${O.primary}14`, color: O.primary, fontWeight: 700 }}>
                              <Zap size={10} /> {req.offer_skill}
                            </span>
                            <Repeat2 size={12} style={{ color: O.mutedFg }} />
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                              style={{ background: `${O.secondary}14`, color: O.secondary, fontWeight: 700 }}>
                              <Star size={10} /> {req.want_skill}
                            </span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                            style={{ background: `${O.secondary}14`, color: O.secondary, fontWeight: 700 }}>
                            <Star size={10} /> {isIncoming ? 'Wants to learn ' : 'Requesting to learn '} {req.want_skill}
                          </span>
                        )}
                      </div>
                      {req.message && (
                        <p className="text-xs mt-2" style={{ color: O.mutedFg, fontStyle: 'italic' }}>
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {isIncoming && req.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <motion.button
                            onClick={() => handleAccept(req.id)}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: `${O.primary}18`, color: O.primary, border: 'none', cursor: 'pointer' }}
                          >
                            <CheckCircle2 size={15} />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDecline(req.id)}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: '#A8544812', color: '#A85448', border: 'none', cursor: 'pointer' }}
                          >
                            <XCircle size={15} />
                          </motion.button>
                        </div>
                      )}
                      {req.status === 'accepted' && onScheduleSession && (
                        <motion.button
                          onClick={() => onScheduleSession(req, partnerId)}
                          className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
                          style={{ background: O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        >
                          Schedule Session
                        </motion.button>
                      )}
                      {!isIncoming && req.status === 'pending' && (
                        <motion.button
                          onClick={() => handleWithdraw(req.id)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
                          style={{ background: '#A8544812', color: '#A85448', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                        >
                          Withdraw
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
