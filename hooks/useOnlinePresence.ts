import { useState, useEffect, useCallback, useRef } from 'react';
import { OnlineUser, UserProfile } from '../types';

const CHANNEL_NAME = 'portal_digital_presence';
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const INACTIVE_THRESHOLD = 15000; // A bit longer than 2 heartbeats

export function useOnlinePresence(profile: UserProfile | null, accessLevel: 'admin' | 'view' | null) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const handleMessage = useCallback((event: MessageEvent) => {
    const { type, payload } = event.data;
    
    setOnlineUsers(currentUsers => {
      const now = Date.now();
      switch(type) {
        case 'PRESENCE_UPDATE': {
          const incomingUser = payload as OnlineUser;
          // Don't process our own broadcasted messages reflected back
          if (incomingUser.sessionId === sessionId) return currentUsers;

          const userExists = currentUsers.some(u => u.sessionId === incomingUser.sessionId);
          if (userExists) {
            // Update lastSeen for existing user
            return currentUsers.map(u => u.sessionId === incomingUser.sessionId ? { ...incomingUser, lastSeen: now } : u);
          } else {
            // Add new user
            return [...currentUsers, { ...incomingUser, lastSeen: now }];
          }
        }
        case 'SIGN_OUT': {
          const { sessionId: departingSessionId } = payload;
          return currentUsers.filter(u => u.sessionId !== departingSessionId);
        }
        default:
          return currentUsers;
      }
    });
  }, [sessionId]);

  const broadcastPresence = useCallback(() => {
    if (!profile || !accessLevel || !channelRef.current) return;

    const me: OnlineUser = {
      ...profile,
      accessLevel,
      sessionId,
      lastSeen: Date.now(),
    };
    
    channelRef.current.postMessage({ type: 'PRESENCE_UPDATE', payload: me });

    setOnlineUsers(currentUsers => {
      const otherUsers = currentUsers.filter(u => u.sessionId !== sessionId);
      return [...otherUsers, me];
    });

  }, [profile, accessLevel, sessionId]);
  
  const signOutPresence = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'SIGN_OUT', payload: { sessionId } });
    }
    setOnlineUsers(currentUsers => currentUsers.filter(user => user.sessionId !== sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (!profile || !accessLevel) {
      if (channelRef.current) {
        signOutPresence();
        channelRef.current.close();
        channelRef.current = null;
      }
      return;
    }

    if (!channelRef.current) {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = handleMessage;
    }

    broadcastPresence(); // Initial broadcast
    const heartbeatInterval = setInterval(broadcastPresence, HEARTBEAT_INTERVAL);
    
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setOnlineUsers(currentUsers => currentUsers.filter(user => (now - user.lastSeen) < INACTIVE_THRESHOLD));
    }, INACTIVE_THRESHOLD);

    window.addEventListener('beforeunload', signOutPresence);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(cleanupInterval);
      window.removeEventListener('beforeunload', signOutPresence);
    };
  }, [profile, accessLevel, broadcastPresence, handleMessage, signOutPresence]);

  return { onlineUsers, signOutPresence };
}
