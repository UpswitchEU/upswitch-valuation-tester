import { NextRequest, NextResponse } from 'next/server'
import { ValuationAPI } from '../../../../src/services/api/valuation/ValuationAPI'
import {
    APIError,
    AuthenticationError,
    CreditError,
    NetworkError,
    RateLimitError,
    ValidationError,
} from '../../../../src/types/errors'
import { apiLogger } from '../../../../src/utils/logger'

/**
 * API Route Configuration
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/valuation/calculate-unified
 * 
 * Unified valuation calculation endpoint that handles both manual and conversational flows.
 * 
 * Request body should match ValuationRequest type.
 * 
 * Error handling:
 * - 400: Validation errors (invalid input)
 * - 401: Authentication errors
 * - 402: Credit errors (insufficient credits)
 * - 429: Rate limit errors
 * - 500: Server errors
 * - 503: Network/service unavailable errors
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        { status: 405 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      apiLogger.warn('Invalid JSON in request body', { error: parseError })
      return NextResponse.json(
        {
          error: 'Invalid request body',
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          message: 'Request body must be an object',
        },
        { status: 400 }
      )
    }

    // Initialize API service
    const valuationAPI = new ValuationAPI()

    // Execute valuation calculation
    const result = await valuationAPI.calculateValuationUnified(body)

    const duration = Date.now() - startTime
    apiLogger.info('Valuation calculation completed', {
      duration,
      valuationId: result?.valuation_id,
    })

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    
    // Handle specific error types
    if (error instanceof ValidationError) {
      apiLogger.warn('Validation error in valuation calculation', {
        error: error.message,
        field: error.field,
        duration,
      })
      return NextResponse.json(
        {
          error: error.message,
          code: 'VALIDATION_ERROR',
          field: error.field,
          recoverable: true,
        },
        { status: 400 }
      )
    }

    if (error instanceof AuthenticationError) {
      apiLogger.warn('Authentication error in valuation calculation', {
        error: error.message,
        duration,
      })
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
          recoverable: true,
        },
        { status: 401 }
      )
    }

    if (error instanceof CreditError) {
      apiLogger.warn('Credit error in valuation calculation', {
        error: error.message,
        duration,
      })
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          code: 'CREDIT_ERROR',
          message: error.message,
          recoverable: true,
        },
        { status: 402 }
      )
    }

    if (error instanceof RateLimitError) {
      apiLogger.warn('Rate limit error in valuation calculation', {
        error: error.message,
        duration,
      })
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_ERROR',
          message: error.message,
          recoverable: true,
          retryAfter: error.context?.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(error.context?.retryAfter || 60),
          },
        }
      )
    }

    if (error instanceof NetworkError) {
      apiLogger.error('Network error in valuation calculation', {
        error: error.message,
        duration,
      })
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          code: 'NETWORK_ERROR',
          message: error.message,
          recoverable: true,
        },
        { status: 503 }
      )
    }

    if (error instanceof APIError) {
      apiLogger.error('API error in valuation calculation', {
        error: error.message,
        statusCode: error.statusCode,
        endpoint: error.endpoint,
        duration,
      })
      return NextResponse.json(
        {
          error: error.message || 'API error occurred',
          code: 'API_ERROR',
          recoverable: error.recoverable,
        },
        { status: error.statusCode || 500 }
      )
    }

    // Handle unknown errors
    apiLogger.error('Unexpected error in valuation calculation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : 'An unexpected error occurred',
        recoverable: false,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/valuation/calculate-unified
 * 
 * This endpoint only accepts POST requests.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      message: 'This endpoint only accepts POST requests',
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    }
  )
}
