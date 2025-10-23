import React, { useState, useRef, useEffect } from 'react';
import { Eye, Code, Info, RefreshCw, Download, Maximize } from 'lucide-react';
import { ValuationToolbarProps } from '../types/valuation';
import { NameGenerator } from '../utils/nameGenerator';
import { BrandedLoading } from './BrandedLoading';
import { generalLogger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';
import { UserDropdown } from './UserDropdown';

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
  const [generatedName, setGeneratedName] = useState(() => {
    if (companyName) {
      return NameGenerator.generateFromCompany(companyName);
    }
    return NameGenerator.generateValuationName();
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Sync editedName when generatedName changes
  useEffect(() => {
    if (!isEditingName) {
      setEditedName(generatedName);
    }
  }, [generatedName, isEditingName]);



  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      setEditedName(valuationName); // Reset if empty
      setIsEditingName(false);
      return;
    }
    
    // Update the displayed name
    setGeneratedName(editedName.trim());
    setIsEditingName(false);
    
    try {
      // Log the save for debugging
      generalLogger.info('Valuation name saved', { name: editedName.trim() });
      
      // TODO: In future, persist to backend
      // await saveValuationName(editedName.trim());
    } catch (error) {
      generalLogger.error('Failed to save valuation name', { error });
      // Note: We don't revert here since the UI update is already done
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


  const handleLogout = async () => {
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
    <nav className="relative min-h-12 w-full shrink-0 flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm overflow-visible">
      <div className="relative max-w-full gap-1 flex w-full shrink-0 items-center">
        <div className="w-full overflow-visible whitespace-nowrap scrollbar-hide">
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
                      className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold text-sm"
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
                  {companyName && (
                    <p className="text-xs text-zinc-400">{companyName}</p>
                  )}
                </div>
                <UserDropdown user={user} onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
