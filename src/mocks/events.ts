import type { MarketplaceEvent } from '@/modules/shared/domain/events'

const listeners = new Set<(event: MarketplaceEvent) => void>()
export const mockEvents = {
  subscribe(listener: (event: MarketplaceEvent) => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  publish(event: MarketplaceEvent) {
    for (const listener of listeners) listener(structuredClone(event))
  },
}

const disconnectListeners = new Set<() => void>()
export const socketControls = {
  subscribe(listener: () => void) {
    disconnectListeners.add(listener)
    return () => {
      disconnectListeners.delete(listener)
    }
  },
  disconnect() {
    for (const listener of [...disconnectListeners]) listener()
  },
}
