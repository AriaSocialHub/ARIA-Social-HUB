import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { OnlineUser, UserProfile } from '../types';


export function useOnlinePresence(profile: UserProfile | null, accessLevel: 'admin' | 'view' | null) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Step 1: Fetch Supabase configuration from our secure API endpoint
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to fetch Supabase config');
        const { supabaseUrl, supabaseAnonKey } = await response.json();
        if (supabaseUrl && supabaseAnonKey) {
            const client = createClient(supabaseUrl, supabaseAnonKey);
            setSupabase(client);
        } else {
             console.error("Supabase URL or Anon Key is missing.");
        }
      } catch (error) {
        console.error("Could not initialize Supabase client:", error);
      }
    };
    fetchConfig();
  }, []);

  // Step 2: Once we have a Supabase client and a user profile, manage the real-time presence channel
  useEffect(() => {
    if (!supabase || !profile || !accessLevel) {
      return;
    }

    // Create a unique channel for presence tracking
    const channel = supabase.channel('online-users', {
        config: {
            presence: {
                key: profile.name, // Use the user's name as the unique key for presence
            },
        },
    });

    channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users = Object.keys(presenceState).map(key => {
            // Each key can have multiple presences if the user is connected on multiple devices.
            // We'll just take the first one.
            const pres = presenceState[key][0] as any; 
            return {
                name: pres.user.name,
                avatar: pres.user.avatar,
                accessLevel: pres.accessLevel,
                sessionId: pres.phx_ref, // Use the unique phoenix reference as a session ID
                lastSeen: new Date(pres.online_at).getTime(),
            };
        });
        setOnlineUsers(users as OnlineUser[]);
    });

    // Subscribe to the channel. Once subscribed, track the user's presence.
    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({
                user: profile,
                accessLevel,
                online_at: new Date().toISOString()
            });
        }
    });
    
    channelRef.current = channel;

    // Cleanup: when the component unmounts, unsubscribe from the channel
    return () => {
        if (channelRef.current) {
            channelRef.current.untrack();
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
    };
  }, [supabase, profile, accessLevel]);

  const signOutPresence = useCallback(() => {
      // When signing out, untrack the user and unsubscribe from the channel
      if (channelRef.current) {
          channelRef.current.untrack();
          channelRef.current.unsubscribe();
      }
  }, []);

  return { onlineUsers, signOutPresence };
}