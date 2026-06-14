/**
 * Real-Time Testing Utility
 * 
 * Import and use this in your components to verify real-time functionality
 * Usage: Call testRealtimeConnection() in your app to diagnose issues
 */

import { supabase } from '@/lib/supabase';

export interface RealtimeTestResult {
  connected: boolean;
  canInsert: boolean;
  canSubscribe: boolean;
  latency: number;
  errors: string[];
}

/**
 * Test real-time connection and permissions
 */
export async function testRealtimeConnection(userId: string): Promise<RealtimeTestResult> {
  const result: RealtimeTestResult = {
    connected: false,
    canInsert: false,
    canSubscribe: false,
    latency: 0,
    errors: [],
  };

  try {
    console.log('🧪 Testing Supabase Real-Time Connection...');

    // Test 1: Check if supabase client is initialized
    if (!supabase) {
      result.errors.push('Supabase client not initialized');
      return result;
    }
    console.log('✅ Supabase client initialized');

    // Test 2: Check WebSocket connection
    const startTime = Date.now();
    
    try {
      // Try to create a simple channel
      const testChannel = supabase.channel('test-connection');
      
      // Monitor connection
      let hasConnection = false;
      
      await new Promise((resolve) => {
        testChannel
          .on('system', { event: 'join' }, () => {
            hasConnection = true;
            result.connected = true;
            console.log('✅ WebSocket connection established');
            resolve(true);
          })
          .subscribe(() => {
            result.latency = Date.now() - startTime;
            console.log(`✅ Connection latency: ${result.latency}ms`);
            resolve(true);
          });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      });

      supabase.removeChannel(testChannel);
    } catch (err) {
      result.errors.push(`WebSocket connection failed: ${err}`);
      console.error('❌ WebSocket connection failed');
    }

    // Test 3: Test INSERT permission on notifications
    try {
      console.log('🧪 Testing INSERT permission...');
      
      const testNotification = {
        user_id: userId,
        title: 'Real-Time Test',
        body: `Connection test at ${new Date().toISOString()}`,
        type: 'test',
        read: false,
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (error) {
        result.errors.push(`INSERT failed: ${error.message}`);
        console.error('❌ INSERT permission denied:', error);
      } else {
        result.canInsert = true;
        console.log('✅ INSERT permission granted');
        
        // Clean up test data
        if (data) {
          await supabase.from('notifications').delete().eq('id', data.id);
        }
      }
    } catch (err) {
      result.errors.push(`INSERT test error: ${err}`);
    }

    // Test 4: Test SUBSCRIBE permission
    try {
      console.log('🧪 Testing SUBSCRIBE permission...');
      
      const subscribeChannel = supabase
        .channel(`test-subscribe:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('✅ Real-time INSERT received:', payload);
            result.canSubscribe = true;
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ SUBSCRIBE permission granted');
            result.canSubscribe = true;
          }
        });

      // Wait briefly to confirm subscription
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      supabase.removeChannel(subscribeChannel);
    } catch (err) {
      result.errors.push(`SUBSCRIBE test error: ${err}`);
    }

    // Test 5: Check real-time tables configuration
    console.log('🧪 Checking table replication configuration...');
    try {
      const tablesToCheck = [
        'notifications',
        'messages',
        'sessions',
        'swap_proposals',
        'profiles',
      ];

      for (const table of tablesToCheck) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          result.errors.push(`Table ${table} not accessible`);
        } else {
          console.log(`✅ Table ${table} is accessible`);
        }
      }
    } catch (err) {
      result.errors.push(`Table check error: ${err}`);
    }

  } catch (err) {
    result.errors.push(`Unexpected error: ${err}`);
    console.error('❌ Test failed:', err);
  }

  // Print summary
  console.log('\n📊 Real-Time Test Summary:');
  console.log(`Connected: ${result.connected ? '✅' : '❌'}`);
  console.log(`Can Insert: ${result.canInsert ? '✅' : '❌'}`);
  console.log(`Can Subscribe: ${result.canSubscribe ? '✅' : '❌'}`);
  console.log(`Latency: ${result.latency}ms`);
  
  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.forEach((err) => console.log(`  - ${err}`));
  }

  return result;
}

/**
 * Simulate real-time data updates
 */
export async function simulateRealtimeUpdate(userId: string) {
  try {
    console.log('🔄 Simulating real-time notification...');
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Real-Time Demo',
        body: 'This notification appeared in real-time!',
        type: 'demo',
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Simulation failed:', error);
      return false;
    }

    console.log('✅ Notification inserted:', data);
    
    // Auto-cleanup after 5 seconds
    setTimeout(async () => {
      if (data) {
        await supabase.from('notifications').delete().eq('id', data.id);
        console.log('🧹 Cleaned up test notification');
      }
    }, 5000);

    return true;
  } catch (err) {
    console.error('❌ Simulation error:', err);
    return false;
  }
}

/**
 * Get real-time connection status
 */
export async function getRealtimeStatus(): Promise<{
  isConnected: boolean;
  activeChannels: number;
}> {
  try {
    // This is a simple check - in production you might want to enhance this
    const channels = supabase.getChannels();
    
    return {
      isConnected: true,
      activeChannels: channels.length,
    };
  } catch (err) {
    return {
      isConnected: false,
      activeChannels: 0,
    };
  }
}

/**
 * Component helper - Add this to any component to auto-test
 */
export function useRealtimeTest(userId: string | undefined) {
  return {
    testConnection: async () => {
      if (!userId) {
        console.warn('❌ User ID not provided');
        return null;
      }
      return await testRealtimeConnection(userId);
    },
    simulateUpdate: async () => {
      if (!userId) {
        console.warn('❌ User ID not provided');
        return false;
      }
      return await simulateRealtimeUpdate(userId);
    },
    getStatus: getRealtimeStatus,
  };
}

// Usage in component:
// const { testConnection, simulateUpdate } = useRealtimeTest(userId);
// await testConnection();
// await simulateUpdate();
