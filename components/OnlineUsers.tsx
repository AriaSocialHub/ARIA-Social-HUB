import React from 'react';
import { OnlineUser, UserProfile } from '../types';
import { getAvatar } from '../services/avatarRegistry';

interface OnlineUsersProps {
  users: OnlineUser[];
  currentUserProfile: UserProfile | null;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users, currentUserProfile }) => {
  // Sort to show current user first, then alphabetically
  const sortedUsers = [...users].sort((a, b) => {
      if (a.name === currentUserProfile?.name) return -1;
      if (b.name === currentUserProfile?.name) return 1;
      return a.name.localeCompare(b.name);
  });

  if (users.length === 0) {
      return null;
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
      {sortedUsers.map(user => {
        const AvatarIcon = getAvatar(user.avatar);
        const isCurrentUser = user.name === currentUserProfile?.name;
        return (
          <div 
            key={user.sessionId} 
            title={user.name + (isCurrentUser ? " (Tu)" : "")} 
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isCurrentUser ? 'bg-white text-blue-700 ring-2 ring-blue-500' : 'bg-white text-gray-600'}`}
          >
            <AvatarIcon className="h-5 w-5" />
          </div>
        );
      })}
    </div>
  );
};

export default OnlineUsers;