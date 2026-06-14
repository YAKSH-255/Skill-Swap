import { useState, useRef, useEffect } from 'react';
import { Users, Plus, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCommunityRooms, useRoomChat } from '@/hooks/useCommunity';
import { useAuth } from '@/contexts/AuthContext';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

const CATEGORIES = [
  'Technology', 'Languages', 'Arts and Creative Skills', 'Music and Performance',
  'Business and Finance', 'Wellness and Lifestyle', 'Academic Subjects', 'Life Skills',
];

export function CommunityPanel() {
  const { user } = useAuth();
  const { rooms, loading, createRoom, joinRoom } = useCommunityRooms();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const { messages, sendMessage } = useRoomChat(activeRoom);
  const [chatText, setChatText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomCategory, setRoomCategory] = useState(CATEGORIES[0]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = async (roomId: string) => {
    if (user) await joinRoom(roomId, user.id);
    setActiveRoom(roomId);
  };

  const handleCreate = async () => {
    if (!user || !roomName.trim()) return;
    const { room } = await createRoom(user.id, roomName.trim(), roomDesc, roomCategory);
    if (room) {
      setActiveRoom(room.id);
      setShowCreate(false);
      setRoomName('');
      setRoomDesc('');
    }
  };

  const handleSend = async () => {
    if (!user || !chatText.trim()) return;
    await sendMessage(user.id, chatText.trim());
    setChatText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg }}>Community Rooms</h3>
          <p style={{ fontSize: 13, color: O.mutedFg }}>Real-time group chat by skill area</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: O.primary, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> Create Room
        </button>
      </div>

      {showCreate && (
        <div className="p-4 rounded-2xl space-y-3" style={{ background: O.muted, border: `1px solid ${O.border}` }}>
          <input placeholder="Room name" value={roomName} onChange={(e) => setRoomName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: `1px solid ${O.border}`, background: O.card }} />
          <textarea placeholder="Description" value={roomDesc} onChange={(e) => setRoomDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" rows={2}
            style={{ border: `1px solid ${O.border}`, background: O.card }} />
          <select value={roomCategory} onChange={(e) => setRoomCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: `1px solid ${O.border}`, background: O.card }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleCreate}
            className="w-full py-2 rounded-xl text-sm text-white"
            style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Create & Join
          </button>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Room list */}
        <div className="w-64 shrink-0 overflow-y-auto rounded-2xl"
          style={{ border: `1px solid ${O.border}`, background: O.muted }}>
          {loading ? (
            <p className="p-4 text-sm" style={{ color: O.mutedFg }}>Loading...</p>
          ) : rooms.length === 0 ? (
            <div className="p-6 text-center">
              <Users size={28} style={{ color: O.mutedFg, margin: '0 auto 8px' }} />
              <p className="text-sm" style={{ color: O.mutedFg }}>No rooms yet. Create the first one!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <button key={room.id} onClick={() => handleJoin(room.id)}
                className="w-full p-3 text-left transition-colors"
                style={{
                  background: activeRoom === room.id ? `${O.primary}15` : 'transparent',
                  border: 'none', cursor: 'pointer', borderBottom: `1px solid ${O.border}40`,
                }}>
                <p className="text-sm font-semibold truncate" style={{ color: O.fg }}>{room.name}</p>
                <p className="text-xs truncate" style={{ color: O.mutedFg }}>{room.category}</p>
                <p className="text-xs mt-1" style={{ color: O.primary }}>{room.member_count} members</p>
              </button>
            ))
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-w-0"
          style={{ border: `1px solid ${O.border}`, background: O.card }}>
          {activeRoom ? (
            <>
              <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${O.border}`, background: O.muted }}>
                <p style={{ fontWeight: 700, color: O.fg }}>
                  {rooms.find((r) => r.id === activeRoom)?.name}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                      style={{ background: O.secondary, fontWeight: 800, fontSize: 10 }}>
                      {(msg.profile?.full_name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: O.fg }}>
                        {msg.profile?.full_name ?? 'User'}
                        <span className="ml-2 font-normal" style={{ color: O.mutedFg }}>
                          {format(parseISO(msg.created_at), 'h:mm a')}
                        </span>
                      </p>
                      <p className="text-sm" style={{ color: O.fg }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 flex gap-2 shrink-0" style={{ borderTop: `1px solid ${O.border}` }}>
                <input value={chatText} onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Message the room..."
                  className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
                  style={{ border: `1px solid ${O.border}`, background: O.muted }} />
                <button onClick={handleSend}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: O.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: O.mutedFg }}>Select or create a room to chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
