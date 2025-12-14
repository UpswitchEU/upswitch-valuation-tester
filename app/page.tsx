'use client'

import { Suspense } from 'react'
import { HomePage } from '../src/components/pages/HomePage'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  )
}
