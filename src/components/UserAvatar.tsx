import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = React.memo(({ 
  size = 'md', 
  className = '' 
}) => {
  const { user, isLoading } = useAuth();
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-6 h-6',
      text: 'text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'w-8 h-8',
      text: 'text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      container: 'w-10 h-10',
      text: 'text-base',
      icon: 'w-5 h-5'
    }
  };

  const config = sizeConfig[size];

  // Get user initials for fallback
  const getUserInitials = () => {
    if (!user?.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Get avatar URL
  const avatarUrl = user?.avatar_url;
  const hasValidAvatar = avatarUrl && !imageError;


  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Button */}
      <div
        className={`
          ${config.container}
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          cursor-pointer
          border-2
          shadow-sm
          hover:shadow-md
          hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        `}
        style={{
          backgroundColor: user ? '#6B7280' : '#6B7280',
          borderColor: user ? '#4B5563' : '#4B5563'
        }}
        aria-label={user ? `${user.name || 'User'}` : 'Guest'}
        role="button"
        tabIndex={0}
      >
        {isLoading ? (
          // Loading state
          <div className="animate-pulse bg-gray-300 rounded-full w-full h-full" />
        ) : user && hasValidAvatar ? (
          // User with avatar image
          <img
            src={avatarUrl}
            alt={user.name || 'User avatar'}
            className="w-full h-full rounded-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : user ? (
          // User without avatar - show initials
          <span 
            className={`${config.text} font-semibold text-gray-200`}
            style={{ lineHeight: 1 }}
          >
            {getUserInitials()}
          </span>
        ) : (
          // Guest user - show user icon
          <User 
            className={`${config.icon} text-gray-200`}
          />
        )}
      </div>

    </div>
  );
});

export default UserAvatar;
