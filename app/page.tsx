'use client'

import { Suspense, useEffect } from 'react'
import { HomePage } from '../src/components/pages/HomePage'

export default function Page() {
  // TEMPORARY: Alert to verify React loaded and cookie detection
  useEffect(() => {
    const hasCookie = document.cookie.includes('upswitch_session')
    const cookieCount = document.cookie ? document.cookie.split(';').length : 0
    alert(
      `🔍 REACT LOADED!\n\n` +
      `Cookie Detection:\n` +
      `- upswitch_session: ${hasCookie ? '✅ YES' : '❌ NO'}\n` +
      `- Total cookies: ${cookieCount}\n` +
      `- Hostname: ${window.location.hostname}\n\n` +
      `Check console for detailed logs`
    )
  }, [])
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  )
}
