import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, Video, Clock } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, differenceInSeconds } from 'date-fns';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewModal } from '../ReviewModal';
import type { Session, SwapProposal } from '@/types/database';
import { toast } from 'sonner';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

function formatSessionDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

function Countdown({ startedAt, durationMinutes }: { startedAt: string; durationMinutes: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const endTime = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
    const tick = () => setRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMinutes]);

  if (remaining <= 0) return <span style={{ color: '#A85448', fontWeight: 700, fontSize: 12 }}>Session ended</span>;

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return (
    <span style={{ color: O.primary, fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
      ⏱ {m}:{String(s).padStart(2, '0')} remaining
    </span>
  );
}

function SessionSkeleton() {
  return (
    <div className="p-4 rounded-2xl animate-pulse flex gap-4" style={{ background: O.muted, height: 104 }}>
      <div className="w-1 rounded-l-2xl shrink-0" style={{ background: O.border }} />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 rounded-full" style={{ background: O.border, width: '40%' }} />
        <div className="h-4 rounded-full" style={{ background: O.border, width: '70%' }} />
        <div className="h-3 rounded-full" style={{ background: O.border, width: '55%' }} />
      </div>
    </div>
  );
}

interface SessionsPanelProps {
  onJoinSession: (session: Session) => void;
  scheduleFor?: { swap: SwapProposal; partnerId: string } | null;
  onClearSchedule?: () => void;
}

export function SessionsPanel({ onJoinSession, scheduleFor, onClearSchedule }: SessionsPanelProps) {
  const { user } = useAuth();
  const { sessions, loading, createSession, updateSessionStatus } = useSessions(user?.id);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);

  const upcoming = sessions.filter((s) => s.status === 'scheduled' || s.status === 'live');
  const past = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled');

  const handleSchedule = async () => {
    if (!scheduleFor || !title || !scheduledAt) {
      toast.error('Please fill in a title and date/time.');
      return;
    }
    setSubmitting(true);
    const { error } = await createSession({
      swapId: scheduleFor.swap.id,
      guestId: scheduleFor.partnerId,
      title,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: duration,
    });
    setSubmitting(false);
    if (!error) {
      toast.success('Session scheduled! 📅');
      setTitle(''); setScheduledAt('');
      onClearSchedule?.();
    } else {
      toast.error('Failed to schedule session.');
    }
  };

  const handleJoin = async (session: Session) => {
    // Only update to 'live' if not already live (fix redundant DB writes)
    if (session.status === 'scheduled') {
      await updateSessionStatus(session.id, 'live');
    }
    onJoinSession(session);
  };

  const handleMarkDone = async (session: Session) => {
    await updateSessionStatus(session.id, 'completed');
    toast.success('Session marked complete!');
    setReviewSession(session);
  };

  const handleCancel = async (sessionId: string) => {
    await updateSessionStatus(sessionId, 'cancelled');
    toast.info('Session cancelled.');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-40 rounded-full animate-pulse" style={{ background: O.muted }} />
        {[1, 2].map((i) => <SessionSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <>
      {reviewSession && (
        <ReviewModal session={reviewSession} onClose={() => setReviewSession(null)} />
      )}

      <div className="space-y-5">
        <div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 20 }}>Sessions</h3>
          <p style={{ fontSize: 13, color: O.mutedFg }}>Live video sessions powered by Jitsi</p>
        </div>

        {/* Schedule Form */}
        <AnimatePresence>
          {scheduleFor && (
            <motion.div
              className="p-5 rounded-2xl space-y-3"
              style={{ background: `${O.primary}08`, border: `1px solid ${O.primary}28` }}
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} style={{ color: O.primary }} />
                <p className="text-sm font-bold" style={{ color: O.primary }}>
                  Schedule: {scheduleFor.swap.offer_skill} ↔ {scheduleFor.swap.want_skill}
                </p>
              </div>
              <input
                placeholder="Session title (e.g., Python basics intro)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.card }}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${O.border}`, background: O.card, color: O.fg }}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSchedule}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Creating...' : 'Create Session'}
                </button>
                <button
                  onClick={onClearSchedule}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: O.muted, color: O.mutedFg, border: `1px solid ${O.border}`, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming sessions */}
        {upcoming.length === 0 && !scheduleFor ? (
          <motion.div
            className="text-center py-16 rounded-2xl"
            style={{ background: O.muted }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <Video size={36} style={{ color: O.mutedFg, margin: '0 auto 14px' }} />
            <p style={{ color: O.mutedFg, fontWeight: 600 }}>No upcoming sessions.</p>
            <p className="text-sm mt-1" style={{ color: O.mutedFg }}>
              Accept a swap to schedule your first session!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session) => {
              const partner = session.host_id === user?.id ? session.guest_profile : session.host_profile;
              const isLive = session.status === 'live';

              return (
                <motion.div
                  key={session.id}
                  className="flex gap-4 p-4 rounded-2xl relative overflow-hidden"
                  style={{ background: O.card, border: `1px solid ${isLive ? '#A85448' + '40' : O.border}` }}
                  whileHover={{ y: -2 }}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: isLive ? '#A85448' : O.primary }}
                  />

                  <div className="pl-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: isLive ? '#A8544818' : `${O.primary}15`,
                          color: isLive ? '#A85448' : O.primary,
                        }}
                      >
                        {isLive ? '🔴 LIVE' : '📅 Scheduled'}
                      </span>
                      <span style={{ fontSize: 12, color: O.mutedFg }}>{formatSessionDate(session.scheduled_at)}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: O.fg, fontFamily: "'Fraunces', serif", marginBottom: 4 }}>
                      {session.title}
                    </p>
                    <p style={{ fontSize: 12, color: O.mutedFg }}>
                      with {partner?.full_name ?? 'Partner'} · {session.duration_minutes} min
                    </p>
                    {isLive && (
                      <div className="mt-1">
                        <Countdown startedAt={session.scheduled_at} durationMinutes={session.duration_minutes} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 justify-center">
                    <motion.button
                      onClick={() => handleJoin(session)}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm"
                      style={{ background: isLive ? '#A85448' : O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      <Play size={13} /> {isLive ? 'Rejoin' : 'Join'}
                    </motion.button>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleMarkDone(session)}
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{ background: O.muted, color: O.fg, fontWeight: 600, border: `1px solid ${O.border}`, cursor: 'pointer' }}
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => handleCancel(session.id)}
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{ background: '#A8544810', color: '#A85448', fontWeight: 600, border: '1px solid #A8544828', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Past sessions */}
        {past.length > 0 && (
          <div>
            <h4 className="text-sm font-bold mb-3" style={{ color: O.mutedFg, letterSpacing: '0.06em' }}>
              PAST SESSIONS
            </h4>
            <div className="space-y-2">
              {past.slice(0, 5).map((s) => {
                const partner = s.host_id === user?.id ? s.guest_profile : s.host_profile;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl text-sm"
                    style={{ background: O.card, border: `1px solid ${O.border}50`, opacity: 0.75 }}
                  >
                    <Clock size={14} style={{ color: O.mutedFg, shrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ color: O.fg, fontWeight: 600 }}>{s.title}</p>
                      {partner && <p className="text-xs" style={{ color: O.mutedFg }}>with {partner.full_name}</p>}
                    </div>
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full"
                      style={{
                        background: s.status === 'completed' ? `${O.primary}15` : '#A8544815',
                        color: s.status === 'completed' ? O.primary : '#A85448',
                        fontWeight: 700,
                      }}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
