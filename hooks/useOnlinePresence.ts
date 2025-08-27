import { useState, useEffect, useCallback, useRef } from 'react';
import { OnlineUser, UserProfile } from '../types';

const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const INACTIVE_THRESHOLD = 15000; // A bit longer than 2 heartbeats

async function updatePresence(profile: UserProfile, accessLevel: 'admin' | 'view', sessionId: string): Promise<OnlineUser[]> {
    const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, accessLevel, sessionId }),
    });
    if (!response.ok) {
        console.error("Failed to update presence");
        return [];
    }
    return response.json();
}

export function useOnlinePresence(profile: UserProfile | null, accessLevel: 'admin' | 'view' | null) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const isBroadcasting = useRef(false);

  const broadcastAndFetch = useCallback(async () => {
      if (!profile || !accessLevel || isBroadcasting.current) return;
      isBroadcasting.current = true;
      try {
          const users = await updatePresence(profile, accessLevel, sessionId);
          setOnlineUsers(users);
      } catch (e) {
          console.error("Presence check failed:", e);
      } finally {
          isBroadcasting.current = false;
      }
  }, [profile, accessLevel, sessionId]);
  
  // This is a dummy function now, as logout is handled by stopping the heartbeats.
  const signOutPresence = useCallback(() => {
    // The heartbeat will naturally stop, and the user will time out on the server.
    // No explicit sign-out message is needed with this polling model.
  }, []);

  useEffect(() => {
    if (!profile || !accessLevel) {
      setOnlineUsers([]);
      return;
    }

    // Initial broadcast
    broadcastAndFetch();
    
    const heartbeatInterval = setInterval(broadcastAndFetch, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [profile, accessLevel, broadcastAndFetch]);

  return { onlineUsers, signOutPresence };
}