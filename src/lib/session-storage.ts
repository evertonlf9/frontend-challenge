/**
 * Guarda apenas o token opaco da sessão simulada.
 * Credenciais nunca são persistidas no cliente.
 */
const TOKEN_KEY = 'kurio.session.token'

let memoryToken: string | null = null
const listeners = new Set<() => void>()
export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function notify() {
  for (const listener of listeners) listener()
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getSessionToken(): string | null {
  const storage = safeStorage()
  if (!storage) {
    return memoryToken
  }
  return storage.getItem(TOKEN_KEY)
}

export function setSessionToken(token: string | null): void {
  memoryToken = token
  const storage = safeStorage()
  if (!storage) {
    notify()
    return
  }
  if (token) {
    storage.setItem(TOKEN_KEY, token)
  } else {
    storage.removeItem(TOKEN_KEY)
  }
  notify()
}

export function expireSessionToken(expected: string | null) {
  if (expected && getSessionToken() === expected) setSessionToken(null)
}

let memoryGuest: string | null = null
export function getGuestCartId(): string {
  const store = safeStorage()
  const saved = store?.getItem('kurio.cart.guest')
  if (saved) return saved
  memoryGuest ??= crypto.randomUUID()
  store?.setItem('kurio.cart.guest', memoryGuest)
  return memoryGuest
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY) notify()
  })
}

export function clearSessionToken(): void {
  setSessionToken(null)
}
