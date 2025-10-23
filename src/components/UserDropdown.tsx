import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, Home, LogIn, UserPlus, Info } from 'lucide-react';
import { User as UserType } from '../contexts/AuthContextTypes';

interface UserDropdownProps {
  user: UserType | null;
  onLogout: () => Promise<void>;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // DEBUG: Log component lifecycle
  useEffect(() => {
    console.log('🔵 [UserDropdown] Mounted', { user: user ? 'authenticated' : 'guest' });
    return () => console.log('🔵 [UserDropdown] Unmounted');
  }, []);

  // DEBUG: Log state changes
  useEffect(() => {
    console.log('🔵 [UserDropdown] isOpen changed:', isOpen);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Get user initials for placeholder
  const getUserInitials = () => {
    if (!user?.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Computed avatar values
  const avatarUrl = user?.avatar_url || user?.avatar;
  const hasAvatar = !!avatarUrl;

  const handleUserClick = (e?: React.MouseEvent) => {
    console.log('🔵 [UserDropdown] Button clicked!', {
      currentIsOpen: isOpen,
      willBeOpen: !isOpen,
      event: e,
      user: user ? 'authenticated' : 'guest'
    });
    setIsOpen(prev => {
      console.log('🔵 [UserDropdown] State update:', prev, '->', !prev);
      return !prev;
    });
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await onLogout();
  };

  const handleSignIn = () => {
    setIsOpen(false);
    // Open parent window to sign in
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'OPEN_LOGIN' }, '*');
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/login', '_blank');
    }
  };

  const handleCreateAccount = () => {
    setIsOpen(false);
    // Open parent window to sign up
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'OPEN_SIGNUP' }, '*');
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/signup', '_blank');
    }
  };

  const handleBackToDashboard = () => {
    setIsOpen(false);
    // Navigate to parent window dashboard
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'NAVIGATE_TO_DASHBOARD' }, '*');
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/my-business', '_blank');
    }
  };

  const handleAccountSettings = () => {
    setIsOpen(false);
    // Navigate to parent window settings
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'NAVIGATE_TO_SETTINGS' }, '*');
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/users/profile', '_blank');
    }
  };

  const handleLearnMore = () => {
    setIsOpen(false);
    // Navigate to parent window about page
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'NAVIGATE_TO_ABOUT' }, '*');
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/about', '_blank');
    }
  };

  // Menu items for authenticated users
  const authenticatedMenuItems = [
    {
      key: 'back-to-dashboard',
      icon: Home,
      label: 'Back to Dashboard',
      action: handleBackToDashboard,
    },
    {
      key: 'account-settings',
      icon: Settings,
      label: 'Account Settings',
      action: handleAccountSettings,
    },
    {
      key: 'divider-1',
      isDivider: true,
    },
    {
      key: 'logout',
      icon: LogOut,
      label: 'Log Out',
      action: handleLogout,
    },
  ];

  // Menu items for guest users
  const guestMenuItems = [
    {
      key: 'sign-in',
      icon: LogIn,
      label: 'Sign In',
      action: handleSignIn,
    },
    {
      key: 'create-account',
      icon: UserPlus,
      label: 'Create Account',
      action: handleCreateAccount,
    },
    {
      key: 'divider-1',
      isDivider: true,
    },
    {
      key: 'learn-more',
      icon: Info,
      label: 'Learn More',
      action: handleLearnMore,
    },
  ];

  const menuItems = user ? authenticatedMenuItems : guestMenuItems;

  // DEBUG: Log every render
  console.log('🔵 [UserDropdown] Rendering', { isOpen, hasUser: !!user });

  return (
    <div ref={dropdownRef} className="relative" style={{ zIndex: 100 }}>
      {/* Avatar Button */}
      <button
        onClick={handleUserClick}
        onMouseDown={(e) => console.log('🔵 [UserDropdown] MouseDown', e)}
        onMouseUp={(e) => console.log('🔵 [UserDropdown] MouseUp', e)}
        className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label={user ? `${user.name || user.email} - Account Menu` : 'Guest - Account Menu'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{ position: 'relative', zIndex: 101 }}
      >
        {user ? (
          <>
            {hasAvatar ? (
              <img
                src={avatarUrl || ''}
                alt={user?.name || 'User'}
                className="w-full h-full rounded-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={hasAvatar ? 'hidden' : 'block'}>
              {getUserInitials()}
            </span>
          </>
        ) : (
          <User className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} aria-hidden="true" />
          
          {/* Dropdown */}
          <div 
            className="fixed w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999]"
            style={{
              top: '60px', // Below header
              right: '20px', // From right edge
            }}
          >
            {/* DEBUG: Visual confirmation */}
            <div className="px-4 py-2 bg-green-100 border-b border-green-200">
              <p className="text-sm text-green-600 font-medium">✅ Dropdown is open!</p>
            </div>
            {/* User Profile Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user ? (
                    <>
                      {hasAvatar ? (
                        <img
                          src={avatarUrl || ''}
                          alt={user?.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={hasAvatar ? 'hidden' : 'block text-white text-sm font-medium'}>
                        {getUserInitials()}
                      </span>
                    </>
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user ? (user.name || 'User') : 'Welcome, Guest'}
                  </div>
                  {user ? (
                    <>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">Sign in to access your dashboard</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                if (item.isDivider) {
                  return (
                    <div key={index} className="h-px bg-gray-200 my-1" role="separator" />
                  );
                }

                const Icon = item.icon;
                const isFirst = index === 0;
                const isLast = index === menuItems.length - 1;

                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.action?.();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-4 sm:py-3 text-base sm:text-sm font-medium text-gray-700 
                      hover:bg-gray-50 transition-colors duration-150 text-left border-0 bg-transparent
                      ${isFirst ? 'rounded-t-xl' : ''}
                      ${isLast ? 'rounded-b-xl text-gray-700 hover:bg-gray-50' : ''}
                    `}
                    role="menuitem"
                    tabIndex={0}
                  >
                    {Icon && <Icon className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />}
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
