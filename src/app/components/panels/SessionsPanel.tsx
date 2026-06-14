import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Calendar, Video } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import type { Session, SwapProposal } from '@/types/database';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

function formatSessionDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
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
  const [submitting, setSubmitting] = useState(false);

  const upcoming = sessions.filter((s) => s.status === 'scheduled' || s.status === 'live');
  const past = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled');

  const handleSchedule = async () => {
    if (!scheduleFor || !title || !scheduledAt) return;
    setSubmitting(true);
    const { error } = await createSession({
      swapId: scheduleFor.swap.id,
      guestId: scheduleFor.partnerId,
      title,
      scheduledAt: new Date(scheduledAt).toISOString(),
    });
    setSubmitting(false);
    if (!error) {
      setTitle('');
      setScheduledAt('');
      onClearSchedule?.();
    }
  };

  const handleJoin = async (session: Session) => {
    if (session.status === 'scheduled') {
      await updateSessionStatus(session.id, 'live');
    }
    onJoinSession(session);
  };

  if (loading) {
    return <p style={{ color: O.mutedFg, padding: 20 }}>Loading sessions...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg }}>Sessions</h3>
        <p style={{ fontSize: 13, color: O.mutedFg }}>Live video sessions powered by Jitsi</p>
      </div>

      {scheduleFor && (
        <motion.div className="p-4 rounded-2xl space-y-3"
          style={{ background: `${O.primary}10`, border: `1px solid ${O.primary}30` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <p className="text-sm font-semibold" style={{ color: O.primary }}>
            Schedule session for swap: {scheduleFor.swap.offer_skill} ↔ {scheduleFor.swap.want_skill}
          </p>
          <input placeholder="Session title" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: `1px solid ${O.border}`, background: O.card }} />
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: `1px solid ${O.border}`, background: O.card }} />
          <div className="flex gap-2">
            <button onClick={handleSchedule} disabled={submitting}
              className="flex-1 py-2 rounded-xl text-sm text-white"
              style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Create Session
            </button>
            <button onClick={onClearSchedule}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: O.muted, color: O.mutedFg, border: `1px solid ${O.border}`, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {upcoming.length === 0 && !scheduleFor ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: O.muted }}>
          <Video size={32} style={{ color: O.mutedFg, margin: '0 auto 12px' }} />
          <p style={{ color: O.mutedFg }}>No upcoming sessions. Accept a swap and schedule your first session!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((session) => {
            const partner = session.host_id === user?.id ? session.guest_profile : session.host_profile;
            return (
              <motion.div key={session.id}
                className="flex gap-4 p-4 rounded-2xl relative overflow-hidden group cursor-pointer"
                style={{ background: O.muted, border: `1px solid ${O.border}` }}
                whileHover={{ y: -2 }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ background: session.status === 'live' ? '#A85448' : O.primary }} />
                <div className="pl-2 flex-1">
                  <p style={{ fontSize: 12, color: O.mutedFg, marginBottom: 3, fontWeight: 600 }}>
                    {formatSessionDate(session.scheduled_at)}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: O.fg, fontFamily: "'Fraunces', serif" }}>
                    {session.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12, color: O.mutedFg }}>with {partner?.full_name ?? 'Partner'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: `${O.primary}18`, color: O.primary, fontWeight: 700 }}>
                      {session.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 self-center">
                  <button onClick={() => handleJoin(session)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm w-full"
                    style={{ background: O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    <Play size={14} /> Join
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => updateSessionStatus(session.id, 'completed')}
                      className="px-3 py-1.5 rounded-full text-xs"
                      style={{ background: O.muted, color: O.fg, fontWeight: 600, border: `1px solid ${O.border}`, cursor: 'pointer' }}>
                      Mark Done
                    </button>
                    <button onClick={() => updateSessionStatus(session.id, 'cancelled')}
                      className="px-3 py-1.5 rounded-full text-xs"
                      style={{ background: '#A8544815', color: '#A85448', fontWeight: 600, border: '1px solid #A8544830', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: O.mutedFg }}>Past Sessions</h4>
          <div className="space-y-2">
            {past.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl text-sm"
                style={{ background: O.card, border: `1px solid ${O.border}50`, opacity: 0.7 }}>
                <Calendar size={14} style={{ color: O.mutedFg }} />
                <span style={{ color: O.fg, flex: 1 }}>{s.title}</span>
                <span className="text-xs capitalize" style={{ color: O.mutedFg }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
