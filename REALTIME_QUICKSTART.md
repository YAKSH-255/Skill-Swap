# Real-Time Data Quick Start

## What's Been Set Up

✅ **Supabase Configuration**
- Created `.env.local` with your Supabase credentials
- Updated `src/lib/supabase.ts` with enhanced real-time configuration

✅ **Real-Time Hooks Library** 
- `src/hooks/useRealtimeData.ts` with 5 ready-to-use hooks:
  - `useRealtimeMessages()` - Real-time chat messages
  - `useRealtimeSessions()` - Real-time video sessions
  - `useRealtimeNotifications()` - Real-time notifications with unread count
  - `useRealtimeSwaps()` - Real-time skill swap proposals
  - `useRealtimeData()` - Generic hook for any table

✅ **Enhanced Existing Hooks**
- Updated `src/hooks/useNotifications.ts` with optimized real-time updates

✅ **Documentation**
- `REALTIME_SETUP.md` - Complete guide with examples

## Quick Start - Testing Real-Time

### 1. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

### 2. Test Real-Time Notifications
```typescript
// In any component
import { useNotifications } from '@/hooks/useNotifications';

function TestNotifications() {
  const { notifications, unreadCount, markRead } = useNotifications(userId);
  
  return (
    <div>
      <h3>Unread: {unreadCount}</h3>
      {notifications.map(n => (
        <div key={n.id} onClick={() => markRead(n.id)}>
          {n.title}: {n.body}
        </div>
      ))}
    </div>
  );
}
```

### 3. Verify Connection
Check browser DevTools:
1. Open DevTools → Network
2. Filter by "WS" (WebSocket)
3. You should see a WebSocket connection to your Supabase instance
4. Look for realtime messages flowing through

### 4. Test Insert Real-Time
```typescript
// Insert a test notification and watch it appear in real-time
async function testRealTime(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Real-Time Test',
      body: 'This appeared in real-time!',
      type: 'test',
      read: false,
    });
  
  console.log('Inserted:', data, error);
  // Component should update instantly
}
```

## Integration Path

### Phase 1: Immediate (Core Features)
1. Update `MessagesPanel.tsx` with real-time messages
2. Update `NotificationsPanel` with real-time notifications  
3. Update `SessionsPanel.tsx` with real-time session updates

### Phase 2: Short-term (Enhanced Features)
1. Real-time swap proposal updates
2. Real-time community activity feeds
3. Real-time typing indicators

### Phase 3: Advanced (Performance)
1. Implement data pagination with real-time
2. Add optimistic updates
3. Implement conflict resolution

## File Structure

```
src/
├── lib/
│   └── supabase.ts (Updated with real-time config)
├── hooks/
│   ├── useRealtimeData.ts (New - Core real-time hooks)
│   ├── useNotifications.ts (Enhanced)
│   ├── useMessages.ts
│   ├── useSessions.ts
│   └── ...
└── app/
    └── components/
        └── panels/
            ├── MessagesPanel.tsx (Ready for real-time)
            ├── SessionsPanel.tsx (Ready for real-time)
            └── NotificationsPanel.tsx (Ready for real-time)
```

## Environment Variables

**File**: `.env.local`
```
VITE_SUPABASE_URL=https://mlbgjzibaakelmmmtagw.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Supabase Dashboard Setup

To complete real-time setup:

1. Go to https://app.supabase.com
2. Login to your project
3. Navigate to **Database** → **Replication**
4. Enable real-time for these tables:
   - [ ] `messages`
   - [ ] `notifications`
   - [ ] `sessions`
   - [ ] `swap_proposals`
   - [ ] `profiles`

5. Navigate to **Database** → **RLS (Row Level Security)**
6. Verify RLS policies allow your users to subscribe

## Common Issues & Fixes

### "Missing VITE_SUPABASE_URL"
- Ensure `.env.local` exists in project root (not in src/)
- Restart dev server after creating `.env.local`

### WebSocket Connection Fails
- Check browser console for CORS errors
- Verify real-time is enabled for the table in Supabase Dashboard
- Check user has RLS permissions

### No Real-Time Updates Received
- Verify table has real-time replication enabled
- Check filter conditions in subscription
- Ensure data is being inserted (not just selected)

### Memory Leaks
- All hooks automatically unsubscribe on unmount
- No manual cleanup needed

## Performance Monitoring

Add to your console:
```typescript
// Monitor real-time events
window.addEventListener('message', (e) => {
  if (e.data?.type === 'SUBSCRIPTION_UPDATE') {
    console.log('Real-time update:', e.data);
  }
});
```

## Next: Update Components

After verifying real-time works, update these components:

**MessagesPanel.tsx**
```typescript
import { useRealtimeMessages } from '@/hooks/useRealtimeData';
```

**SessionsPanel.tsx** 
```typescript
import { useRealtimeSessions } from '@/hooks/useRealtimeData';
```

**NotificationBell.tsx**
```typescript
import { useRealtimeNotifications } from '@/hooks/useRealtimeData';
```

## Support Files

- 📖 [Full Real-Time Guide](./REALTIME_SETUP.md)
- 🔑 [Environment Config](./.env.local)
- 🎣 [Real-Time Hooks](./src/hooks/useRealtimeData.ts)
- 📝 [Supabase Config](./src/lib/supabase.ts)

---

**Ready to test?** Run `npm run dev` and check your browser console! 🚀
