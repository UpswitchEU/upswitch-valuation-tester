/**
 * Asset Inspector
 * 
 * Developer tool for inspecting asset store states in real-time.
 * Only visible in development mode.
 * 
 * Shows for each asset:
 * - Status (idle, loading, loaded, error)
 * - Mode (send, receive, idle)
 * - Progress (0-100%)
 * - Error messages if any
 * 
 * @module components/debug/AssetInspector
 */

'use client'

import React, { useState } from 'react'
import { useInputFieldsAsset } from '../../store/assets/manual/useInputFieldsAsset'
import { useMainReportAsset } from '../../store/assets/shared/useMainReportAsset'
import { useInfoTabAsset } from '../../store/assets/shared/useInfoTabAsset'
import { useVersionsAsset } from '../../store/assets/shared/useVersionsAsset'
import { useFinalPriceAsset } from '../../store/assets/shared/useFinalPriceAsset'
import { useChatMessagesAsset } from '../../store/assets/conversational/useChatMessagesAsset'
import { useSummaryAsset } from '../../store/assets/conversational/useSummaryAsset'
import { useCollectedDataAsset } from '../../store/assets/conversational/useCollectedDataAsset'
import type { AssetStore } from '../../store/assets/createAssetStore'

export function AssetInspector() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<'manual' | 'conversational' | 'shared'>('manual')
  
  // Get all asset stores
  const inputFields = useInputFieldsAsset()
  const mainReport = useMainReportAsset()
  const infoTab = useInfoTabAsset()
  const versions = useVersionsAsset()
  const finalPrice = useFinalPriceAsset()
  const chatMessages = useChatMessagesAsset()
  const summary = useSummaryAsset()
  const collectedData = useCollectedDataAsset()
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl hover:bg-gray-800 transition-colors z-50 text-sm font-medium"
      >
        🔍 Asset Inspector
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-2xl rounded-lg w-96 max-h-[600px] overflow-hidden z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-sm">🔍 Asset Inspector</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* Flow selector */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setSelectedFlow('manual')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectedFlow === 'manual'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setSelectedFlow('conversational')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectedFlow === 'conversational'
              ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Conversational
        </button>
        <button
          onClick={() => setSelectedFlow('shared')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectedFlow === 'shared'
              ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Shared
        </button>
      </div>
      
      {/* Asset list */}
      <div className="overflow-y-auto max-h-[480px]">
        {selectedFlow === 'manual' && (
          <div className="p-3 space-y-2">
            <AssetStatus name="Input Fields" asset={inputFields} />
          </div>
        )}
        
        {selectedFlow === 'conversational' && (
          <div className="p-3 space-y-2">
            <AssetStatus name="Chat Messages" asset={chatMessages} />
            <AssetStatus name="Summary" asset={summary} />
            <AssetStatus name="Collected Data" asset={collectedData} />
          </div>
        )}
        
        {selectedFlow === 'shared' && (
          <div className="p-3 space-y-2">
            <AssetStatus name="Main Report" asset={mainReport} />
            <AssetStatus name="Info Tab" asset={infoTab} />
            <AssetStatus name="Versions" asset={versions} />
            <AssetStatus name="Final Price" asset={finalPrice} />
          </div>
        )}
      </div>
    </div>
  )
}

interface AssetStatusProps {
  name: string
  asset: AssetStore<any>
}

function AssetStatus({ name, asset }: AssetStatusProps) {
  const statusColors = {
    idle: 'bg-gray-100 text-gray-700',
    loading: 'bg-blue-100 text-blue-700',
    loaded: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  }
  
  const modeColors = {
    idle: 'text-gray-500',
    send: 'text-blue-600',
    receive: 'text-purple-600',
  }
  
  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm text-gray-900">{name}</span>
        <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[asset.status]}`}>
          {asset.status}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Mode:</span>
          <span className={`font-medium ${modeColors[asset.mode]}`}>
            {asset.mode === 'send' && '→ Send'}
            {asset.mode === 'receive' && '← Receive'}
            {asset.mode === 'idle' && '⚪ Idle'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Progress:</span>
          <span className="font-medium">{asset.progress}%</span>
        </div>
      </div>
      
      {asset.status === 'loading' && asset.progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${asset.progress}%` }}
          />
        </div>
      )}
      
      {asset.error && (
        <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 border border-red-200">
          {asset.error}
        </div>
      )}
      
      {asset.data && (
        <div className="text-xs text-gray-500">
          {asset.lastSyncedAt && (
            <div>
              Synced: {new Date(asset.lastSyncedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

