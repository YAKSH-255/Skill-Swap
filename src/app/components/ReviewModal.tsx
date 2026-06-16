import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Session } from '@/types/database';
import { toast } from 'sonner';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

const SKILL_TAGS = [
  'Communication', 'Patience', 'Depth of Knowledge', 'Punctuality',
  'Adaptability', 'Engagement', 'Clarity', 'Encouragement',
];

const LABELS = ['', 'Disappointing', 'Could be better', 'Good', 'Great!', 'Outstanding! 🌟'];

interface ReviewModalProps {
  session: Session;
  onClose: () => void;
}

export function ReviewModal({ session, onClose }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [endorsements, setEndorsements] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const revieweeId = session.host_id === user?.id ? session.guest_id : session.host_id;
  const revieweeName = session.host_id === user?.id
    ? session.guest_profile?.full_name
    : session.host_profile?.full_name;

  const toggleEndorsement = (tag: string) =>
    setEndorsements((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      session_id: session.id,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment,
      skill_endorsements: endorsements,
    });

    if (!error) {
      setDone(true);
      toast.success('Review submitted! Thank you for your feedback.');
      setTimeout(onClose, 1800);
    } else {
      toast.error('Failed to submit review. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(44,44,36,0.55)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl p-6 relative"
        style={{ background: O.card, boxShadow: '0 24px 64px -12px rgba(44,44,36,0.28)' }}
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: O.muted, border: 'none', cursor: 'pointer', color: O.mutedFg }}
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              className="flex flex-col items-center py-10 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 size={60} style={{ color: O.primary, marginBottom: 20 }} />
              </motion.div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: O.fg }}>
                Review Submitted!
              </h3>
              <p style={{ color: O.mutedFg, marginTop: 8, fontSize: 14 }}>
                Thank you for helping the community grow.
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-5" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: O.fg, marginBottom: 4 }}>
                  Rate Your Session
                </h3>
                <p style={{ fontSize: 13, color: O.mutedFg }}>
                  How was your session with{' '}
                  <strong style={{ color: O.fg }}>{revieweeName ?? 'your partner'}</strong>?
                </p>
              </div>

              {/* Star Rating */}
              <div className="flex gap-3 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star
                      size={38}
                      color={O.secondary}
                      fill={(hovered || rating) >= star ? O.secondary : 'none'}
                      strokeWidth={(hovered || rating) >= star ? 0 : 1.5}
                    />
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {(hovered || rating) > 0 && (
                  <motion.p
                    key={hovered || rating}
                    className="text-center text-sm font-bold"
                    style={{ color: O.secondary }}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  >
                    {LABELS[hovered || rating]}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Comment */}
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: O.mutedFg, letterSpacing: '0.06em' }}>
                  COMMENTS (OPTIONAL)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share what made this session great..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
                  style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg, lineHeight: 1.6 }}
                />
              </div>

              {/* Endorsements */}
              <div>
                <label className="text-xs font-bold mb-2 block" style={{ color: O.mutedFg, letterSpacing: '0.06em' }}>
                  ENDORSE QUALITIES (OPTIONAL)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_TAGS.map((tag) => (
                    <motion.button
                      key={tag}
                      onClick={() => toggleEndorsement(tag)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{
                        background: endorsements.includes(tag) ? O.primary : O.muted,
                        color: endorsements.includes(tag) ? '#fff' : O.mutedFg,
                        border: `1px solid ${endorsements.includes(tag) ? O.primary : O.border}`,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {endorsements.includes(tag) ? '✓ ' : ''}{tag}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm"
                style={{
                  background: O.primary,
                  fontWeight: 800,
                  border: 'none',
                  cursor: rating === 0 ? 'not-allowed' : 'pointer',
                  opacity: rating === 0 ? 0.45 : 1,
                }}
                whileHover={{ scale: rating > 0 ? 1.02 : 1 }}
                whileTap={{ scale: rating > 0 ? 0.98 : 1 }}
              >
                <Send size={15} />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
