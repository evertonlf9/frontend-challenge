import { DEFAULT_SCENARIO, isMockScenario, type MockScenarioId } from '../scenarios'
import { createSeedState } from './fixtures'
import type { MockState } from './types'

const STORAGE_KEY = 'kurio.mock.state.v3'

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

let state: MockState | null = null

function isUsable(candidate: unknown): candidate is MockState {
  if (!candidate || typeof candidate !== 'object') {
    return false
  }
  const value = candidate as Partial<MockState>
  return typeof value.revision === 'number' && Array.isArray(value.nfts) && Array.isArray(value.users)
    && !!value.quotes && !!value.idempotency && !!value.sessions && !!value.carts
}

function readFromStorage(): MockState {
  const store = storage()
  if (!store) {
    return createSeedState()
  }
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) {
      return createSeedState()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isUsable(parsed)) return createSeedState()
    const assets = ["emerald", "sage", "neon", "sage", "sage", "neon", "golden", "golden", "golden"]
    for (const [index, nft] of parsed.nfts.entries()) {
      if (nft.imageUrl.startsWith("/artwork/") && nft.imageUrl.endsWith(".png")) { nft.imageUrl = nft.imageUrl.replace(".png", ".webp"); nft.galleryUrls = nft.galleryUrls.map((url) => url.replace(".png", ".webp")) }
      if (nft.imageUrl.includes("art-") || nft.imageUrl.includes("coresg-normal")) { nft.imageUrl = "/artwork/" + assets[index % assets.length] + ".webp"; nft.galleryUrls = [nft.imageUrl, ...["emerald", "sage", "neon"].map((name) => "/artwork/" + name + ".webp")] }
      nft.popularity ??= (index * 37 + 31) % 100
    }
    return parsed
  } catch {
    return createSeedState()
  }
}

/** Estado singleton da simulação, recuperado do storage quando possível. */
export function getState(): MockState {
  if (!state) {
    state = readFromStorage()
    const configured = import.meta.env.VITE_MOCK_SCENARIO
    if (isMockScenario(configured) && !storage()?.getItem(STORAGE_KEY)) state.scenario = configured
  }
  return state
}

export function persist(): void {
  const current = getState()
  current.revision += 1
  const store = storage()
  if (store) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      // Sem persistência disponível: o estado permanece apenas em memória.
    }
  }
}

/** Executa uma transformação e persiste o resultado. */
export function mutate<T>(transform: (current: MockState) => T): T {
  const previous = structuredClone(getState())
  try {
    const result = transform(getState())
    persist()
    return structuredClone(result)
  } catch (error) {
    state = previous
    throw error
  }
}

/** Restaura integralmente o cenário conhecido. */
export function resetState(): MockState {
  state = createSeedState()
  state.scenario = DEFAULT_SCENARIO
  const local = storage()
  if (local) for (const key of Object.keys(local)) if (key.startsWith("kurio.order.attempt:") || key === "kurio.cart.coupon") local.removeItem(key)
  try { for (const key of Object.keys(window.sessionStorage)) if (key.startsWith("kurio.checkout.draft:")) window.sessionStorage.removeItem(key) } catch { /* Storage indisponível. */ }
  persist()
  return state
}

export function setScenario(scenario: MockScenarioId): void {
  mutate((current) => {
    current.scenario = scenario
  })
}

export function getActiveScenario(): MockScenarioId {
  const candidate = getState().scenario
  return isMockScenario(candidate) ? candidate : DEFAULT_SCENARIO
}

/**
 * Gera identificadores estáveis e previsíveis para a simulação.
 * Não persiste por conta própria: quem altera estado chama `mutate`/`persist`.
 */
export function nextId(prefix: string): string {
  const current = getState()
  const next = (current.counters[prefix] ?? 0) + 1
  current.counters[prefix] = next
  return `${prefix}_${next.toString().padStart(4, '0')}`
}
