import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export function MessagesPanel() {
  const { user } = useAuth();
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const { messages, conversations, loading, sendMessage } = useMessages(user?.id, activePartner ?? undefined);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !activePartner) return;
    setSending(true);
    const { error } = await sendMessage(activePartner, text.trim());
    setSending(false);
    if (!error) setText('');
  };

  const activeConv = conversations.find((c) => c.partner.id === activePartner);

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[400px] rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${O.border}`, background: O.card }}>
      {/* Conversation list */}
      <div className="w-72 shrink-0 overflow-y-auto" style={{ borderRight: `1px solid ${O.border}`, background: O.muted }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${O.border}` }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg }}>Messages</h3>
          <p style={{ fontSize: 12, color: O.mutedFg }}>Real-time chat</p>
        </div>
        {loading ? (
          <p className="p-4 text-sm" style={{ color: O.mutedFg }}>Loading...</p>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare size={28} style={{ color: O.mutedFg, margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: O.mutedFg }}>No conversations yet</p>
          </div>
        ) : (
          conversations.map(({ partner, lastMessage, unread }) => (
            <button key={partner.id} onClick={() => setActivePartner(partner.id)}
              className="w-full flex items-center gap-3 p-3 text-left transition-colors"
              style={{
                background: activePartner === partner.id ? `${O.primary}15` : 'transparent',
                border: 'none', cursor: 'pointer', borderBottom: `1px solid ${O.border}40`,
              }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                style={{ background: O.primary, fontWeight: 800 }}>
                {initials(partner.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 700, color: O.fg }}>{partner.full_name}</p>
                <p className="text-xs truncate" style={{ color: O.mutedFg }}>{lastMessage.content}</p>
              </div>
              {unread > 0 && (
                <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ background: O.secondary, fontWeight: 800, fontSize: 10 }}>
                  {unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activePartner ? (
          <>
            <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${O.border}` }}>
              <p style={{ fontWeight: 700, color: O.fg }}>{activeConv?.partner.full_name}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%] px-4 py-2 rounded-2xl text-sm"
                      style={{
                        background: isMine ? O.primary : O.muted,
                        color: isMine ? '#fff' : O.fg,
                        borderRadius: isMine ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                      }}>
                      <p>{msg.content}</p>
                      <p className="text-xs mt-1 opacity-60">
                        {format(parseISO(msg.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 flex gap-2 shrink-0" style={{ borderTop: `1px solid ${O.border}` }}>
              <input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted }} />
              <button onClick={handleSend} disabled={sending || !text.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: O.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: O.mutedFg }}>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
