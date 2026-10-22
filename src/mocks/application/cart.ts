import type { Cart } from '@/modules/cart/domain/cart.contracts'
import type { FavoritesResponse } from '@/modules/favorites/domain/favorites.contracts'
import type { MockStore } from '../domain/store'
import { fail, quantity, record, text } from './validation'

export function createCart(store: MockStore) {
  const get = (owner: string): Cart => ({
    items: (store.read().carts[owner] ?? []).flatMap((line) => {
      const nft = store.read().nfts.find((item) => item.id === line.nftId)
      return nft ? [{ nftId: nft.id, name: nft.name, imageUrl: nft.imageUrl, network: nft.network, unitPriceEth: nft.priceEth, quantity: line.quantity, available: nft.available, maxPerOrder: nft.maxPerOrder }] : []
    }),
    itemCount: (store.read().carts[owner] ?? []).reduce((sum, item) => sum + item.quantity, 0),
    updatedAt: new Date(store.now()).toISOString(),
  })
  return {
    get,
    save(owner: string, input: unknown, nftId?: string) {
      const body = record(input)
      const id = nftId ?? text(body.nftId, 'nftId')
      const count = quantity(body.quantity)
      const nft = store.read().nfts.find((item) => item.id === id)
      if (!nft) fail('NOT_FOUND', 404)
      const previous = (store.read().carts[owner] ?? []).find((item) => item.nftId === id)
      if (nftId && !previous) fail('NOT_FOUND', 404)
      const requested = nftId ? count : count + (previous?.quantity ?? 0)
      if (requested > nft.available || requested > nft.maxPerOrder || store.read().scenario === 'availability-conflict') fail('AVAILABILITY_CONFLICT', 409)
      store.transaction((state) => { state.carts[owner] = (state.carts[owner] ?? []).filter((item) => item.nftId !== id).concat({ nftId: id, quantity: requested }) })
      return get(owner)
    },
    remove(owner: string, id: string) {
      store.transaction((state) => { state.carts[owner] = (state.carts[owner] ?? []).filter((item) => item.nftId !== id) })
      return get(owner)
    },
  }
}

export function createFavorites(store: MockStore) {
  const get = (owner: string): FavoritesResponse => ({ items: structuredClone(store.read().nfts.filter((nft) => (store.read().favorites[owner] ?? []).includes(nft.id))) })
  return {
    get,
    set(owner: string, id: string, selected: boolean) {
      if (store.read().scenario === 'favorite-error') fail('SERVICE_UNAVAILABLE', 503)
      if (!store.read().nfts.some((item) => item.id === id)) fail('NOT_FOUND', 404)
      store.transaction((state) => {
        const ids = (state.favorites[owner] ?? []).filter((item) => item !== id)
        state.favorites[owner] = selected ? ids.concat(id) : ids
      })
      return get(owner)
    },
  }
}
