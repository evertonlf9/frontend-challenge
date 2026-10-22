import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api-error'

/**
 * Política única de cache/retry. Documentada em docs/api-contracts.md.
 * - `staleTime` de 30s: leitura considerada fresca; evita refetch em navegação.
 * - `gcTime` de 5min: mantém dados quentes ao voltar para uma tela.
 * - `retry` apenas para falhas transitórias (RATE_LIMITED/SERVICE_UNAVAILABLE/
 *   GATEWAY_TIMEOUT/NETWORK_ERROR), com backoff exponencial limitado a 8s.
 * - `refetchOnReconnect`: reconciliação após reconexão.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && !error.isRetriable) {
    return false
  }
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetryQuery,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
})
