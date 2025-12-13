import { NextRequest, NextResponse } from 'next/server'
import { ValuationAPI } from '../../../../src/services/api/valuation/ValuationAPI'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const valuationAPI = new ValuationAPI()

    const result = await valuationAPI.calculateValuationUnified(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
