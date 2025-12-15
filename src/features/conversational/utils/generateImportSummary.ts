/**
 * Generate Import Summary Message
 * 
 * Creates a summary message when switching from manual to conversational flow
 * with pre-filled data, showing what data was imported
 */

import type { ValuationRequest } from '../../../types/valuation'
import type { Message } from '../../../types/message'

export function generateImportSummaryMessage(sessionData: Partial<ValuationRequest>): Omit<Message, 'id' | 'timestamp'> {
  const fields: string[] = []
  
  // Collect filled fields
  if (sessionData.company_name) {
    fields.push(`**Company**: ${sessionData.company_name}`)
  }
  
  if (sessionData.business_type_id) {
    fields.push(`**Business Type**: ${sessionData.business_type || sessionData.business_type_id}`)
  }
  
  if (sessionData.country_code) {
    fields.push(`**Country**: ${sessionData.country_code}`)
  }
  
  if (sessionData.founding_year) {
    fields.push(`**Founded**: ${sessionData.founding_year}`)
  }
  
  if (sessionData.current_year_data?.revenue) {
    const revenue = sessionData.current_year_data.revenue
    fields.push(`**Revenue**: €${revenue.toLocaleString()}`)
  }
  
  if (sessionData.current_year_data?.ebitda !== undefined) {
    const ebitda = sessionData.current_year_data.ebitda
    fields.push(`**EBITDA**: €${ebitda.toLocaleString()}`)
  }
  
  if (sessionData.number_of_employees !== undefined) {
    fields.push(`**Employees**: ${sessionData.number_of_employees}`)
  }
  
  if (sessionData.number_of_owners !== undefined) {
    fields.push(`**Owners**: ${sessionData.number_of_owners}`)
  }
  
  if (sessionData.shares_for_sale !== undefined) {
    fields.push(`**Shares for Sale**: ${sessionData.shares_for_sale}%`)
  }
  
  // Build summary message
  const content = fields.length > 0
    ? `📋 **Data imported from manual form**\n\nI've loaded the following information:\n\n${fields.join('\n')}\n\n✅ You can continue this conversation to modify any of these values or add additional information.`
    : `📋 **Switched to conversational flow**\n\nI'm ready to help you collect valuation data. What would you like to tell me about your business?`
  
  return {
    type: 'ai',
    role: 'assistant',
    content,
    isComplete: true,
    isStreaming: false,
    metadata: {
      session_phase: 'manual_import',
      imported_fields: fields.length,
      is_summary: true,
    },
  }
}

/**
 * Check if session has data but no conversation messages
 * This indicates a manual → conversational flow switch with pre-filled data
 */
export function shouldGenerateImportSummary(
  sessionData: Partial<ValuationRequest> | undefined,
  messages: Message[]
): boolean {
  // No messages in conversation
  const hasNoMessages = messages.length === 0
  
  // Has meaningful data in session
  const hasData = !!(
    sessionData?.company_name ||
    sessionData?.business_type_id ||
    sessionData?.current_year_data?.revenue ||
    sessionData?.current_year_data?.ebitda
  )
  
  return hasNoMessages && hasData
}

