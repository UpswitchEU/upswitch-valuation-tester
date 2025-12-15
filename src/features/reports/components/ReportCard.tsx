/**
 * Report Card Component
 * 
 * Single Responsibility: Display individual report preview
 * Like Lovable template cards: thumbnail, metadata, actions
 */

'use client'

import { Calendar, Clock, Trash2, TrendingUp } from 'lucide-react'
import React, { useState } from 'react'
import { formatCurrency } from '../../../config/countries'
import type { ValuationSession } from '../../../types/valuation'

export interface ReportCardProps {
  report: ValuationSession
  onClick: () => void
  onDelete: () => void
}

/**
 * Report Card Component
 * 
 * M&A Workflow Enhancement:
 * - Always navigates to edit mode (not view mode)
 * - Clicking any report (even completed) opens editable form
 * - Enables continuous adjustments and regeneration
 * - Like Figma projects: always editable, previews are secondary
 */
export function ReportCard({ report, onClick, onDelete }: ReportCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Extract data from report
  const companyName = report.partialData?.company_name || 'Untitled Valuation'
  const industry = report.partialData?.industry || 'business'
  const countryCode = report.partialData?.country_code || 'BE'
  const createdAt = report.createdAt
  const currentView = report.currentView || 'manual'
  
  // Determine status from session state
  // M&A workflow: All reports are "editable" - status just indicates calculation state
  const status = report.completedAt ? 'completed' : 'in_progress'
  
  // Get valuation result if available (completed reports)
  // Type assertion since sessionData can contain valuation_result from backend
  const valuationResult = (report.sessionData as any)?.valuation_result || null
  
  // Format date
  const formatDate = (date: Date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return 'Recently'
    }
  }
  
  // Calculate completeness (simple heuristic)
  const calculateCompleteness = (): number => {
    if (status === 'completed') return 100
    
    const data = report.partialData || {}
    let filledFields = 0
    let totalFields = 6
    
    if (data.company_name) filledFields++
    if (data.industry) filledFields++
    if (data.country_code) filledFields++
    if (data.current_year_data?.revenue) filledFields++
    if (data.current_year_data?.ebitda) filledFields++
    if (data.business_type_id) filledFields++
    
    return Math.round((filledFields / totalFields) * 100)
  }
  
  // Handle delete with confirmation
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Delete "${companyName}"? This action cannot be undone.`)) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete report:', error)
      alert('Failed to delete report. Please try again.')
      setIsDeleting(false)
    }
  }
  
  // Get status badge color
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }
  
  const completeness = calculateCompleteness()
  
  return (
    <div
      className={`
        group relative bg-white border border-gray-200 rounded-lg overflow-hidden
        cursor-pointer transition-all duration-200
        ${isHovered ? 'shadow-lg border-primary-500' : 'shadow-sm hover:shadow-md'}
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with industry icon and status */}
      <div className="relative p-4 bg-gradient-to-br from-primary-50 to-primary-100">
        {/* Industry icon placeholder */}
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <TrendingUp className="w-6 h-6 text-primary-600" />
        </div>
        
        {/* Status badge */}
        <div className={`
          absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border
          ${getStatusColor()}
        `}>
          {status === 'completed' ? 'Completed' : 'In Progress'}
        </div>
        
        {/* Delete button (visible on hover) */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`
            absolute bottom-3 right-3 p-2 rounded-lg
            bg-white text-red-600 hover:bg-red-50 hover:text-red-700
            transition-all duration-200 shadow-sm
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          title="Delete report"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Company name */}
        <h3 className="font-semibold text-lg text-gray-900 truncate mb-2">
          {companyName}
        </h3>
        
        {/* Metadata */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(createdAt)}</span>
          </div>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="capitalize">{currentView}</span>
          </div>
        </div>
        
        {/* Progress indicator (for in-progress reports) */}
        {status === 'in_progress' && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Completeness</span>
              <span>{completeness}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Valuation result preview (for completed reports) */}
        {status === 'completed' && valuationResult && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Estimated Value</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(
                (valuationResult as any).valuation_summary?.final_valuation || 
                (valuationResult as any).value || 
                0,
                countryCode
              )}
            </p>
          </div>
        )}
        
        {/* Hover indicator */}
        {isHovered && (
          <div className="mt-3 text-sm text-primary-600 font-medium flex items-center gap-1">
            <span>Open report</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
        )}
      </div>
    </div>
  )
}
