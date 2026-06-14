# Real-Time Data Setup Guide

## Configuration

Your Supabase credentials have been configured in `.env.local`:
- **URL**: https://mlbgjzibaakelmmmtagw.supabase.co
- **Public Key**: sb_publishable_rKAQnYB-m-7jR_kAck_SrA_VV7B3GNs (VITE_SUPABASE_ANON_KEY)
- **Secret Key**: sb_secret_nTbYOZgwzdBpf5KkhPqQPA_dY5mCKQj (SUPABASE_SERVICE_ROLE_KEY)

The Supabase client is configured in `src/lib/supabase.ts` with real-time support enabled.

## Available Real-Time Hooks

### 1. **useRealtimeMessages(userId: string)**
Subscribe to real-time messages for a specific user.

```typescript
import { useRealtimeMessages } from '@/hooks/useRealtimeData';

function MessagesPanel() {
  const { messages, loading } = useRealtimeMessages(userId);
  
  return (
    <div>
      {loading && <p>Loading messages...</p>}
      {messages.map(msg => (
        <p key={msg.id}>{msg.content}</p>
      ))}
    </div>
  );
}
```

### 2. **useRealtimeSessions(userId: string)**
Subscribe to real-time session updates (INSERT, UPDATE, DELETE).

```typescript
import { useRealtimeSessions } from '@/hooks/useRealtimeData';

function SessionsPanel() {
  const { sessions, loading } = useRealtimeSessions(userId);
  
  return (
    <div>
      {sessions.map(session => (
        <div key={session.id}>
          <h3>{session.title}</h3>
          <p>Status: {session.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. **useRealtimeNotifications(userId: string)**
Subscribe to real-time notifications with unread count tracking.

```typescript
import { useRealtimeNotifications } from '@/hooks/useRealtimeData';

function NotificationBell() {
  const { notifications, unreadCount } = useRealtimeNotifications(userId);
  
  return (
    <div>
      <span className="badge">{unreadCount}</span>
      {notifications.map(notif => (
        <p key={notif.id}>{notif.body}</p>
      ))}
    </div>
  );
}
```

### 4. **useRealtimeSwaps(userId: string)**
Subscribe to real-time swap proposal updates.

```typescript
import { useRealtimeSwaps } from '@/hooks/useRealtimeData';

function SwapsPanel() {
  const { swaps, loading } = useRealtimeSwaps(userId);
  
  return (
    <div>
      {swaps.map(swap => (
        <div key={swap.id}>
          <p>{swap.offer_skill} ↔ {swap.want_skill}</p>
          <p>Status: {swap.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### 5. **useRealtimeData(table, onData?, options)**
Generic hook for subscribing to any table.

```typescript
import { useRealtimeData } from '@/hooks/useRealtimeData';

function CustomRealtimeComponent() {
  const { data, loading, error } = useRealtimeData(
    'profiles',
    (newData) => console.log('New profile:', newData),
    { event: 'INSERT' } // Only listen to INSERT events
  );
  
  return (
    <div>
      {error && <p>Error: {error.message}</p>}
      {loading && <p>Loading...</p>}
    </div>
  );
}
```

## Hook Options

- **event**: 'INSERT' | 'UPDATE' | 'DELETE' | '*' (default: '*')
- **schema**: Database schema (default: 'public')

## Integration Examples

### Example 1: Real-Time Messages in MessagesPanel
Update `src/app/components/panels/MessagesPanel.tsx`:

```typescript
import { useRealtimeMessages } from '@/hooks/useRealtimeData';
import { useAuth } from '@/contexts/AuthContext';

export function MessagesPanel() {
  const { session } = useAuth();
  const { messages, loading } = useRealtimeMessages(session?.user?.id || '');
  
  if (loading) return <div>Loading messages...</div>;
  
  return (
    <div className="space-y-4">
      {messages.map(msg => (
        <div key={msg.id} className="p-3 border rounded">
          <p>{msg.content}</p>
          <small className="text-gray-500">
            {new Date(msg.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Real-Time Notifications
```typescript
import { useRealtimeNotifications } from '@/hooks/useRealtimeData';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationCenter() {
  const { session } = useAuth();
  const { notifications, unreadCount } = useRealtimeNotifications(session?.user?.id || '');
  
  return (
    <div>
      <div className="badge badge-error">{unreadCount}</div>
      <div className="notification-list">
        {notifications.map(notif => (
          <div key={notif.id} className={notif.read ? 'opacity-50' : ''}>
            <h4>{notif.title}</h4>
            <p>{notif.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Database Prerequisites

Ensure your Supabase database has the following tables with real-time enabled:
- `profiles` (user profiles)
- `messages` (chat messages)
- `sessions` (video sessions)
- `notifications` (user notifications)
- `swap_proposals` (skill swaps)

## Enabling Real-Time in Supabase

For each table, you need to enable real-time:

1. Go to your Supabase Dashboard
2. Click on "Replication" in the Database section
3. Enable real-time for the required tables

## Performance Tips

- Real-time events are limited to 10 per second (configurable)
- Subscribe only to needed data to reduce bandwidth
- Use filters to limit data streams
- Unsubscribe when components unmount (automatic with useEffect cleanup)

## Testing Real-Time Data

```typescript
// In any component
const { supabase } = useAuth();

async function testInsert() {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: userId,
      receiver_id: recipientId,
      content: 'Real-time test message'
    });
  
  console.log('Insert result:', data, error);
}
```

## Troubleshooting

**Problem**: Real-time not working
- Verify table has real-time enabled in Supabase Dashboard
- Check browser DevTools console for WebSocket connection errors
- Ensure user has permission to subscribe to the table

**Problem**: No updates received
- Check network tab in DevTools for WebSocket messages
- Verify the filter conditions are correct
- Make sure data changes happen in the correct table

**Problem**: High latency
- Reduce event frequency with the `event` option
- Use more specific filters
- Check Supabase dashboard for API usage

## Next Steps

1. Update existing components to use the new real-time hooks
2. Remove any polling-based data fetching
3. Test with real-time dashboard to verify live updates
4. Monitor performance in production
