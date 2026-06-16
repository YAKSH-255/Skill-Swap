import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileModal, hashColor } from '../UserProfileModal';
import { toast } from 'sonner';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function ConvSkeleton() {
  return (
    <div className="p-3 flex items-center gap-3 animate-pulse">
      <div className="w-9 h-9 rounded-full shrink-0" style={{ background: `${O.border}` }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded-full" style={{ background: O.border, width: '70%' }} />
        <div className="h-2.5 rounded-full" style={{ background: O.border, width: '50%' }} />
      </div>
    </div>
  );
}

export function MessagesPanel() {
  const { user } = useAuth();
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const { messages, conversations, loading, sendMessage } = useMessages(user?.id, activePartner ?? undefined);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !activePartner) return;
    setSending(true);
    const { error } = await sendMessage(activePartner, text.trim());
    setSending(false);
    if (!error) {
      setText('');
    } else {
      toast.error('Failed to send message. Try again.');
    }
  };

  const activeConv = conversations.find((c) => c.partner.id === activePartner);

  return (
    <>
      {viewProfileId && (
        <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}

      <div
        className="flex rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${O.border}`, background: O.card, height: 'calc(100vh - 180px)', minHeight: 420 }}
      >
        {/* Conversation list */}
        <div
          className="shrink-0 overflow-y-auto flex flex-col"
          style={{ width: 260, borderRight: `1px solid ${O.border}`, background: O.muted }}
        >
          <div className="p-4 shrink-0" style={{ borderBottom: `1px solid ${O.border}` }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg }}>Messages</h3>
            <p style={{ fontSize: 12, color: O.mutedFg }}>Real-time chat</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <>{[1, 2, 3].map((i) => <ConvSkeleton key={i} />)}</>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={28} style={{ color: O.mutedFg, margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: O.mutedFg }}>No conversations yet</p>
                <p className="text-xs mt-1" style={{ color: O.mutedFg }}>Accept a swap to start chatting</p>
              </div>
            ) : (
              conversations.map(({ partner, lastMessage, unread }) => (
                <button
                  key={partner.id}
                  onClick={() => setActivePartner(partner.id)}
                  className="w-full flex items-center gap-3 p-3 text-left transition-colors"
                  style={{
                    background: activePartner === partner.id ? `${O.primary}15` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${O.border}40`,
                    borderLeft: activePartner === partner.id ? `3px solid ${O.primary}` : '3px solid transparent',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white shrink-0 overflow-hidden"
                    style={{ background: hashColor(partner.full_name ?? ''), fontWeight: 800 }}
                  >
                    {partner.avatar_url
                      ? <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                      : initials(partner.full_name)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ fontWeight: 700, color: O.fg }}>{partner.full_name}</p>
                    <p className="text-xs truncate" style={{ color: O.mutedFg }}>{lastMessage.content}</p>
                  </div>
                  {unread > 0 && (
                    <span
                      className="text-xs w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ background: O.secondary, fontWeight: 800, fontSize: 10 }}
                    >
                      {unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activePartner ? (
            <>
              {/* Chat header */}
              <div
                className="px-4 py-3 shrink-0 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${O.border}`, background: O.card }}
              >
                <button
                  onClick={() => setViewProfileId(activePartner)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white overflow-hidden shrink-0"
                  style={{ background: hashColor(activeConv?.partner.full_name ?? ''), border: 'none', cursor: 'pointer', fontWeight: 800 }}
                >
                  {activeConv?.partner.avatar_url
                    ? <img src={activeConv.partner.avatar_url} alt="" className="w-full h-full object-cover" />
                    : initials(activeConv?.partner.full_name)
                  }
                </button>
                <div>
                  <button
                    onClick={() => setViewProfileId(activePartner)}
                    style={{ fontWeight: 700, color: O.fg, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {activeConv?.partner.full_name}
                  </button>
                  <p style={{ fontSize: 11, color: O.mutedFg }}>Click to view profile</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p style={{ color: O.mutedFg, fontSize: 14 }}>No messages yet — say hello! 👋</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div
                        className="max-w-[72%] px-4 py-2.5 text-sm"
                        style={{
                          background: isMine ? O.primary : O.muted,
                          color: isMine ? '#fff' : O.fg,
                          borderRadius: isMine ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
                          boxShadow: isMine ? '0 2px 12px rgba(93,112,82,0.25)' : 'none',
                        }}
                      >
                        <p style={{ lineHeight: 1.5 }}>{msg.content}</p>
                        <p className="text-xs mt-1" style={{ opacity: 0.6, textAlign: isMine ? 'right' : 'left' }}>
                          {format(parseISO(msg.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 flex gap-2 shrink-0" style={{ borderTop: `1px solid ${O.border}` }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
                  style={{ border: `1px solid ${O.border}`, background: O.muted }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: O.primary, color: '#fff', border: 'none', cursor: 'pointer', opacity: !text.trim() ? 0.5 : 1 }}
                  whileHover={{ scale: text.trim() ? 1.08 : 1 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <MessageSquare size={40} style={{ color: O.mutedFg }} />
              <p style={{ color: O.mutedFg, fontSize: 15, fontWeight: 600 }}>Select a conversation</p>
              <p style={{ color: O.mutedFg, fontSize: 13 }}>Choose a partner from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
