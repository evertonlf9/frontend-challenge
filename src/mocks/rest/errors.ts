import { HttpResponse } from 'msw'
import type { ApiErrorCode, ApiFieldIssue } from '@/lib/api-error'

/** Constrói o envelope de erro previsto nos contratos REST. */
export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message?: string,
  details?: ApiFieldIssue[]
): Response {
  return HttpResponse.json({ error: { code, message, details } }, { status })
}

export function fieldIssue(field: string, message: string): ApiFieldIssue {
  return { field, message }
}

export function validationError(details: ApiFieldIssue[], message?: string): Response {
  return errorResponse(422, 'VALIDATION_ERROR', message, details)
}

export function notFound(message?: string): Response {
  return errorResponse(404, 'NOT_FOUND', message)
}

export function unauthenticated(message?: string): Response {
  return errorResponse(401, 'UNAUTHENTICATED', message)
}

export function sessionExpired(message?: string): Response {
  return errorResponse(401, 'SESSION_EXPIRED', message)
}

export function forbidden(message?: string): Response {
  return errorResponse(403, 'FORBIDDEN', message)
}

export function conflict(message?: string, details?: ApiFieldIssue[]): Response {
  return errorResponse(409, 'CONFLICT', message, details)
}

export function availabilityConflict(message?: string, details?: ApiFieldIssue[]): Response {
  return errorResponse(409, 'AVAILABILITY_CONFLICT', message, details)
}

export function idempotencyConflict(message?: string): Response {
  return errorResponse(409, 'IDEMPOTENCY_CONFLICT', message)
}

export function couponError(code: 'COUPON_INVALID' | 'COUPON_EXPIRED'): Response {
  return errorResponse(422, code)
}

export function rateLimited(): Response {
  return errorResponse(429, 'RATE_LIMITED')
}

export function serviceUnavailable(): Response {
  return errorResponse(503, 'SERVICE_UNAVAILABLE')
}
