import type { CreateOrderInput } from '../domain/order.contracts'

/** Persiste payload e chave juntos antes do envio; um timeout nunca cria outra tentativa. */
export function orderAttempt(userId: string, input: Omit<CreateOrderInput, 'idempotencyKey'>): CreateOrderInput {
  const key = `kurio.order.attempt:${userId}`
  const fingerprint = JSON.stringify(input)
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as { fingerprint: string; input: CreateOrderInput } | null
    if (saved?.input) return saved.input
  } catch { /* Um registro inválido é substituído por uma nova tentativa. */ }
  const attempt = { ...input, idempotencyKey: crypto.randomUUID() }
  localStorage.setItem(key, JSON.stringify({ fingerprint, input: attempt }))
  return attempt
}
export function pendingAttempt(userId: string): CreateOrderInput | null {
  try { return (JSON.parse(localStorage.getItem(`kurio.order.attempt:${userId}`) ?? 'null') as { input?: CreateOrderInput } | null)?.input ?? null } catch { return null }
}
export function clearAttempt(userId: string, expectedKey?: string) {
  if (expectedKey && pendingAttempt(userId)?.idempotencyKey !== expectedKey) return
  localStorage.removeItem(`kurio.order.attempt:${userId}`)
}
