import { getState, mutate, nextId } from './db/state'
import { createAccounts } from './application/accounts'
import { createCart, createFavorites } from './application/cart'
import { createCheckout } from './application/checkout'
import { createCatalog } from './application/catalog'
import type { MockStore } from './domain/store'
import { mockEvents } from './events'
import type { Order } from '@/modules/orders/domain/order.contracts'

// Composition root: apenas este adaptador conecta os casos de uso à persistência.
const store: MockStore = { read: getState, transaction: mutate, id: nextId, now: Date.now }
export const mockApi = {
  accounts: createAccounts(store),
  cart: createCart(store),
  favorites: createFavorites(store),
  checkout: createCheckout(store),
  catalog: createCatalog(store),
}

export function publishOrder(order: Order) {
  const owner = getState().orderOwners[order.id]
  mockEvents.publish({
    id: `order:${order.id}:${order.version}`,
    type: 'order.updated',
    resourceId: order.id,
    userId: owner,
    version: order.version,
    data: order,
  })
  if (order.status === 'confirmed') {
    for (const line of order.items) {
      const nft = mockApi.catalog.get(line.nftId)
      mockEvents.publish({
        id: `nft:${nft.id}:${nft.version}`,
        type: 'nft.updated',
        resourceId: nft.id,
        version: nft.version,
        data: nft,
      })
    }
  }
}
