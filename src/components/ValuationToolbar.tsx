import {
    Code,
    Download,
    Edit3,
    Eye,
    Info,
    Loader2,
    Maximize,
    MessageSquare,
    RefreshCw,
} from 'lucide-react'
import React from 'react'
import {
    useValuationToolbarAuth,
    useValuationToolbarDownload,
    useValuationToolbarFlow,
    useValuationToolbarFullscreen,
    useValuationToolbarName,
    useValuationToolbarRefresh,
    useValuationToolbarTabs,
} from '../hooks/valuationToolbar'
import { useValuationSessionStore } from '../store/useValuationSessionStore'
import { ValuationToolbarProps } from '../types/valuation'
import { FlowSwitchWarningModal } from './FlowSwitchWarningModal'
import { UserDropdown } from './UserDropdown'
import { Tooltip } from './ui/Tooltip'

export const ValuationToolbar: React.FC<ValuationToolbarProps> = ({
  onRefresh,
  onDownload,
  onFullScreen,
  isGenerating = false,
  user,
  valuationName = 'Valuation test123',
  activeTab = 'preview',
  onTabChange,
  companyName,
}) => {
  const { session, pendingFlowSwitch } = useValuationSessionStore()

  // Use focused hooks for business logic
  const {
    showSwitchConfirmation,
    handleFlowIconClick,
    handleConfirmSwitch,
    handleCancelSwitch,
    isSyncing,
  } = useValuationToolbarFlow()

  const {
    isEditingName,
    editedName,
    setEditedName,
    generatedName,
    nameInputRef,
    handleNameEdit,
    handleNameSave,
    handleNameCancel,
    handleKeyDown,
  } = useValuationToolbarName({
    initialName: valuationName,
    companyName,
  })

  const { handleLogout } = useValuationToolbarAuth()

  // Tab management hook - use prop if provided (parent-controlled), otherwise use hook state
  const { activeTab: hookActiveTab, handleTabChange: handleHookTabChange } =
    useValuationToolbarTabs({
      initialTab: activeTab,
      onTabChange,
    })

  // Use prop tab if provided (parent-controlled), otherwise use hook state
  const currentActiveTab = activeTab ?? hookActiveTab
  const handleTabClick = (tab: 'preview' | 'source' | 'info') => {
    // If parent provides onTabChange, use it (parent-controlled)
    // Otherwise use hook handler (self-controlled)
    if (onTabChange) {
      onTabChange(tab)
    } else {
      handleHookTabChange(tab)
    }
  }

  // Refresh hook - use prop if provided, otherwise use hook
  const { handleRefresh: handleHookRefresh } = useValuationToolbarRefresh()
  const handleRefresh = onRefresh ?? handleHookRefresh

  // Download hook - track loading state for UI feedback
  // Note: Parent components should provide onDownload handler that uses the hook
  const { isDownloading } = useValuationToolbarDownload()
  const handleDownload = onDownload ?? (() => {
    // If no prop handler provided, this shouldn't be called
    // Parent components should always provide onDownload handler
  })

  // Fullscreen hook - use prop if provided, otherwise use hook
  const { handleOpenFullscreen: handleHookFullscreen } =
    useValuationToolbarFullscreen()
  const handleFullScreen = onFullScreen ?? handleHookFullscreen

  return (
    <>
      <nav className="relative min-h-12 w-full shrink-0 flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm overflow-visible">
        <div className="relative max-w-full gap-1 flex w-full shrink-0 items-center">
          <div className="w-full overflow-visible whitespace-nowrap scrollbar-hide">
            <div className="relative flex w-full flex-shrink-0 items-center justify-between">
              {/* Left Section - Valuation Name */}
              <div className="flex flex-shrink-0 items-center gap-2" style={{ width: '23%' }}>
                <div className="relative flex items-center gap-2 group">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-harvest-500 to-harvest-600 animate-pulse shadow-[0_0_8px_rgba(217,165,88,0.5)]"></div>
                    )}
                    {isEditingName ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-transparent bg-clip-text bg-gradient-to-r from-harvest-400 to-harvest-500 font-semibold text-sm"
                        style={{ minWidth: '120px' }}
                      />
                    ) : (
                      <button
                        onClick={handleNameEdit}
                        className="hidden md:block font-semibold text-transparent bg-clip-text bg-gradient-to-r from-harvest-400 to-harvest-500 hover:from-harvest-300 hover:to-harvest-400 transition-all duration-200 cursor-pointer hover:scale-105 drop-shadow-[0_1px_3px_rgba(217,165,88,0.4)]"
                        title="Click to edit valuation name"
                      >
                        {generatedName}
                      </button>
                    )}
                    <button
                      onClick={handleNameEdit}
                      className="md:hidden text-xs text-harvest-400 font-bold hover:text-harvest-300 transition-colors cursor-pointer"
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
                {/* Flow Toggles */}
                <Tooltip content="Manual Input" position="bottom" className="">
                  <button
                    onClick={() => handleFlowIconClick('manual')}
                    disabled={session?.currentView === 'manual' || isSyncing}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      session?.currentView === 'manual'
                        ? 'bg-zinc-700 text-white'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                    } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSyncing && session?.currentView !== 'manual' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>
                <Tooltip content="Conversational Mode" position="bottom" className="">
                  <button
                    onClick={() => handleFlowIconClick('conversational')}
                    disabled={session?.currentView === 'conversational' || isSyncing}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      session?.currentView === 'conversational'
                        ? 'bg-zinc-700 text-white'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                    } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSyncing && session?.currentView !== 'conversational' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>
                <div className="mx-2 h-6 w-px bg-zinc-700"></div>

                <Tooltip content="Preview" position="bottom" className="">
                  <button
                    onClick={() => handleTabClick('preview')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentActiveTab === 'preview'
                        ? 'bg-zinc-700 text-white'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Source Code" position="bottom" className="">
                  <button
                    onClick={() => handleTabClick('source')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentActiveTab === 'source'
                        ? 'bg-zinc-700 text-white'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Valuation Info" position="bottom" className="">
                  <button
                    onClick={() => handleTabClick('info')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentActiveTab === 'info'
                        ? 'bg-zinc-700 text-white'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </Tooltip>
                <div className="mx-2 h-6 w-px bg-zinc-700"></div>
                <Tooltip content="Refresh" position="bottom" className="">
                  <button
                    onClick={handleRefresh}
                    className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-300 hover:bg-zinc-800"
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Download PDF" position="bottom" className="">
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-300 hover:bg-zinc-800"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>
                <Tooltip content="Open Full Screen" position="bottom" className="">
                  <button
                    onClick={handleFullScreen}
                    className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-300 hover:bg-zinc-800"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>

              {/* Right Section - User Info */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-3">
                  <UserDropdown user={user} onLogout={handleLogout} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <FlowSwitchWarningModal
        isOpen={showSwitchConfirmation}
        currentFlow={session?.currentView || 'manual'}
        targetFlow={pendingFlowSwitch || 'manual'}
        onConfirm={handleConfirmSwitch}
        onClose={handleCancelSwitch}
      />
    </>
  )
}
