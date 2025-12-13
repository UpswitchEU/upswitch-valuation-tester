/**
 * Conversation Compound Component
 *
 * Compound component pattern for conversation interface.
 * Reduces prop drilling by using React Context internally.
 *
 * Usage:
 * ```tsx
 * <Conversation value={conversationData}>
 *   <Conversation.Header />
 *   <Conversation.Messages />
 *   <Conversation.Input />
 * </Conversation>
 * ```
 *
 * @module features/conversation/components/Conversation
 */

import React, { createContext, memo, ReactNode, useContext } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface ConversationContextValue {
  messages: Message[]
  isLoading: boolean
  sessionId: string
  onSendMessage?: (message: string) => void
  onClearHistory?: () => void
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

function useConversationContext() {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('Conversation compound components must be used within <Conversation>')
  }
  return context
}

interface ConversationProps {
  children: ReactNode
  value: ConversationContextValue
}

/**
 * Root Conversation component
 * Provides context for all sub-components
 */
const ConversationRoot = memo<ConversationProps>(({ children, value }) => {
  return (
    <ConversationContext.Provider value={value}>
      <div className="h-full flex flex-col bg-zinc-900">{children}</div>
    </ConversationContext.Provider>
  )
})

ConversationRoot.displayName = 'Conversation'

/**
 * Conversation Header sub-component
 * Displays conversation title and metadata
 */
const ConversationHeader = memo(() => {
  const { onClearHistory } = useConversationContext()

  return (
    <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary-400" />
        <h3 className="text-sm font-medium text-white">Conversation</h3>
      </div>
      {onClearHistory && (
        <button
          onClick={onClearHistory}
          className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
})

ConversationHeader.displayName = 'Conversation.Header'

/**
 * Conversation Messages sub-component
 * Displays message list
 */
const ConversationMessages = memo(() => {
  const { messages, isLoading } = useConversationContext()

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Start a conversation to begin your valuation</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.type === 'user' ? 'bg-primary-600 text-white' : 'bg-zinc-800 text-zinc-100'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs mt-1 opacity-70">{message.timestamp.toLocaleTimeString()}</p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
})

ConversationMessages.displayName = 'Conversation.Messages'

/**
 * Conversation Input sub-component
 * Displays input field for sending messages
 */
const ConversationInput = memo(() => {
  const { onSendMessage, isLoading } = useConversationContext()
  const [input, setInput] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && onSendMessage) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <div className="border-t border-zinc-800 p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Send
        </button>
      </form>
    </div>
  )
})

ConversationInput.displayName = 'Conversation.Input'

/**
 * Compound Conversation component with sub-components
 */
export const Conversation = Object.assign(ConversationRoot, {
  Header: ConversationHeader,
  Messages: ConversationMessages,
  Input: ConversationInput,
})
