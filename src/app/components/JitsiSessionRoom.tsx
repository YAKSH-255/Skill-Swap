import { useEffect, useRef } from 'react';
import { lazy, Suspense } from 'react';
import { X } from 'lucide-react';
import type { Session } from '@/types/database';

const JitsiMeeting = lazy(() =>
  import('@jitsi/react-sdk').then((m) => ({ default: m.JitsiMeeting })),
);

interface JitsiSessionRoomProps {
  session: Session;
  displayName: string;
  onClose: () => void;
  onSessionEnd?: () => void;
}

export function JitsiSessionRoom({ session, displayName, onClose, onSessionEnd }: JitsiSessionRoomProps) {
  const endedRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#1a1a18' }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: '#2C2C24', borderBottom: '1px solid #DED8CF30' }}>
        <div>
          <p className="text-white font-semibold text-sm">{session.title}</p>
          <p className="text-xs" style={{ color: '#78786C' }}>Room: {session.jitsi_room}</p>
        </div>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#A8544820', color: '#F88E80', border: 'none', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-white">Loading video room...</div>
        }>
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={session.jitsi_room}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              prejoinPageEnabled: true,
              disableDeepLinking: true,
            }}
            interfaceConfigOverwrite={{
              MOBILE_APP_PROMO: false,
              SHOW_JITSI_WATERMARK: false,
            }}
            userInfo={{ displayName }}
            getIFrameRef={(node) => {
              if (node) { node.style.height = '100%'; node.style.width = '100%'; }
            }}
            onReadyToClose={() => {
              if (!endedRef.current) { endedRef.current = true; onSessionEnd?.(); }
              onClose();
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
