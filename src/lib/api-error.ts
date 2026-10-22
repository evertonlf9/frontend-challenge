/**
 * Códigos de erro previstos pelos contratos REST.
 * Ver docs/api-contracts.md para o significado e o status HTTP de cada código.
 */
export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'AVAILABILITY_CONFLICT',
  'QUOTE_STALE',
  'IDEMPOTENCY_CONFLICT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'PAYMENT_DECLINED',
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'NETWORK_ERROR',
  'INVALID_RESPONSE',
  'UNKNOWN',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export interface ApiFieldIssue {
  field: string
  message: string
}

/** Envelope único de erro devolvido pela API simulada. */
export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode
    message: string
    details?: ApiFieldIssue[]
  }
}

/** Falhas transitórias: podem ser repetidas com segurança. */
const RETRIABLE_CODES: ReadonlySet<ApiErrorCode> = new Set<ApiErrorCode>([
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'NETWORK_ERROR',
])

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: 'Não foi possível validar os dados enviados.',
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  UNAUTHENTICATED: 'Autenticação necessária para continuar.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para esta operação.',
  NOT_FOUND: 'Recurso não encontrado.',
  CONFLICT: 'Já existe um recurso com estes dados.',
  AVAILABILITY_CONFLICT: 'A disponibilidade do item mudou. Revise seu pedido.',
  QUOTE_STALE: 'A cotação mudou ou expirou. Revise os valores e confirme novamente.',
  IDEMPOTENCY_CONFLICT: 'Esta tentativa foi reenviada com conteúdo diferente.',
  COUPON_INVALID: 'Cupom inválido.',
  COUPON_EXPIRED: 'Cupom expirado.',
  PAYMENT_DECLINED: 'Pagamento recusado pela carteira.',
  RATE_LIMITED: 'Muitas requisições. Tente novamente em instantes.',
  SERVICE_UNAVAILABLE: 'Serviço indisponível no momento.',
  GATEWAY_TIMEOUT: 'A operação demorou demais e foi interrompida.',
  NETWORK_ERROR: 'Falha de conexão com o servidor.',
  INVALID_RESPONSE:
    'O servidor retornou dados inválidos. Tente recuperar a operação antes de reenviá-la.',
  UNKNOWN: 'Ocorreu um erro inesperado.',
}

/** Erro de domínio normalizado, independente do transporte. */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details: ApiFieldIssue[]

  constructor(
    payload: { code: ApiErrorCode; message?: string; details?: ApiFieldIssue[] },
    status = 0
  ) {
    super(payload.message ?? DEFAULT_MESSAGES[payload.code])
    this.name = 'ApiError'
    this.code = payload.code
    this.status = status
    this.details = payload.details ?? []
  }

  /** Indica se a operação pode ser repetida automaticamente. */
  get isRetriable(): boolean {
    return RETRIABLE_CODES.has(this.code)
  }

  /** Mensagem associada a um campo, quando existir. */
  fieldMessage(field: string): string | undefined {
    return this.details.find((issue) => issue.field === field)?.message
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

/** Converte qualquer falha (Axios, rede, timeouts) em `ApiError`. */
export function parseApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const transport = error as { response?: { data?: unknown; status: number }; code?: string }
    const envelope = transport.response?.data
    const payload =
      envelope && typeof envelope === 'object' && 'error' in envelope ? envelope.error : null
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      typeof payload.code === 'string' &&
      (API_ERROR_CODES as readonly string[]).includes(payload.code)
    ) {
      const message =
        'message' in payload && typeof payload.message === 'string' ? payload.message : undefined
      const details =
        'details' in payload && Array.isArray(payload.details)
          ? payload.details.filter(
              (issue): issue is ApiFieldIssue =>
                !!issue &&
                typeof issue === 'object' &&
                typeof issue.field === 'string' &&
                typeof issue.message === 'string'
            )
          : []
      return new ApiError(
        { code: payload.code as ApiErrorCode, message, details },
        transport.response?.status ?? 0
      )
    }

    if (transport.code === 'ECONNABORTED' || transport.code === 'ETIMEDOUT') {
      return new ApiError({ code: 'GATEWAY_TIMEOUT' }, 504)
    }

    if (!transport.response) {
      return new ApiError({ code: 'NETWORK_ERROR' }, 0)
    }

    return new ApiError({ code: 'UNKNOWN' }, transport.response.status)
  }

  if (error instanceof Error) {
    return new ApiError({ code: 'UNKNOWN', message: error.message })
  }

  return new ApiError({ code: 'UNKNOWN' })
}
