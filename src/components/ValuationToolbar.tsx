import React, { useState, useRef, useEffect } from 'react';
import { Eye, Code, Info, RefreshCw, Download, Maximize, LogOut } from 'lucide-react';
// import { UserAvatar } from './UserAvatar';
import { ValuationToolbarProps } from '../types/valuation';
import { NameGenerator } from '../utils/nameGenerator';
import { BrandedLoading } from './BrandedLoading';
import { generalLogger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';

export const ValuationToolbar: React.FC<ValuationToolbarProps> = ({
  onRefresh,
  onDownload,
  onFullScreen,
  isGenerating = false,
  user,
  valuationName = 'Valuation test123',
  activeTab = 'preview',
  onTabChange,
  companyName
}) => {
  const { refreshAuth } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(valuationName);
  
  // Generate unique name based on company or default
  const [generatedName] = useState(() => {
    if (companyName) {
      return NameGenerator.generateFromCompany(companyName);
    }
    return NameGenerator.generateValuationName();
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);


  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showUserDropdown) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showUserDropdown]);

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      setEditedName(valuationName); // Reset if empty
      setIsEditingName(false);
      return;
    }
    
    setIsEditingName(false);
    
    try {
      // For now, just log the save - in a real implementation, this would save to backend
      // await saveValuationName(editedName);
      generalLogger.info('Valuation name saved', { name: editedName });
    } catch (error) {
      generalLogger.error('Failed to save valuation name', { error });
      setEditedName(valuationName); // Revert on error
    }
  };

  const handleNameCancel = () => {
    setEditedName(valuationName);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleTabClick = (tab: 'preview' | 'source' | 'info') => {
    onTabChange?.(tab);
  };

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

  const handleUserClick = () => {
    // Only show dropdown for authenticated users
    if (user) {
      setShowUserDropdown(!showUserDropdown);
    }
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    
    try {
      generalLogger.info('Logging out user');
      
      // Get backend URL from environment
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                        import.meta.env.VITE_API_BASE_URL || 
                        'https://web-production-8d00b.up.railway.app';
      
      // Call backend logout endpoint
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send authentication cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        generalLogger.info('Logout successful');
        // Refresh auth state to clear user data
        await refreshAuth();
      } else {
        generalLogger.warn('Logout request failed', { status: response.status });
        // Still refresh auth state in case session is already invalid
        await refreshAuth();
      }
    } catch (error) {
      generalLogger.error('Logout failed', { error });
      // Still refresh auth state to clear local state
      await refreshAuth();
    }
  };

  return (
    <nav className="relative min-h-12 w-full shrink-0 flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
      <div className="relative max-w-full gap-1 flex w-full shrink-0 items-center">
        <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="relative flex w-full flex-shrink-0 items-center justify-between">
            {/* Left Section - Valuation Name */}
            <div className="flex flex-shrink-0 items-center gap-2" style={{ width: '23%' }}>
              <div className="relative flex items-center gap-2 group">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  {isGenerating ? (
                    <BrandedLoading size="sm" color="white" />
                  ) : (
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
                  )}
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={handleKeyDown}
                      className="bg-transparent border-none outline-none text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold"
                      style={{ minWidth: '120px' }}
                    />
                  ) : (
                    <button
                      onClick={handleNameEdit}
                      className="hidden md:block font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-300 hover:to-purple-300 transition-all duration-200 cursor-pointer hover:scale-105"
                      title="Click to edit valuation name"
                    >
                      {generatedName}
                    </button>
                  )}
                  <button
                    onClick={handleNameEdit}
                    className="md:hidden text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors cursor-pointer"
                    title="Click to edit valuation name"
                  >
                    Valuation
                  </button>
                </div>
                <div className="hidden md:block text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  ✏️
                </div>
              </div>
            </div>

            {/* Center Section - Action Buttons */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1">
              <button
                onClick={() => handleTabClick('preview')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'preview' 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                }`}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleTabClick('source')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'source' 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                }`}
                title="Source Code"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleTabClick('info')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'info' 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                }`}
                title="Valuation Info"
              >
                <Info className="w-4 h-4" />
              </button>
              <div className="mx-2 h-6 w-px bg-zinc-700"></div>
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-300 hover:bg-zinc-800"
                title="Refresh"
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onDownload}
                className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-300 hover:bg-zinc-800"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onFullScreen}
                className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-300 hover:bg-zinc-800"
                title="Open Full Screen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            {/* Right Section - User Info */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {isGenerating ? 'Generating...' : 'Ready'}
                  </p>
                  {companyName && (
                    <p className="text-xs text-zinc-400">{companyName}</p>
                  )}
                </div>
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={handleUserClick}
                    className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label={user ? `${user.name || user.email} - Account Menu` : 'Guest - Account Menu'}
                    aria-expanded={showUserDropdown}
                    aria-haspopup="true"
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
                      <span className="text-xs font-medium">Guest</span>
                    )}
                  </button>
                  
                  {showUserDropdown && user && (
                    <>
                      {/* Backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} aria-hidden="true" />
                      
                      {/* Dropdown */}
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        {/* User Profile Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.name || 'User'}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
