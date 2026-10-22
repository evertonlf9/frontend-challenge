import { useEffect, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepositories } from './api-context'
import { createQueries, keys } from './queries'
import {
  getGuestCartId,
  getSessionToken,
  setSessionToken,
  subscribeSession,
  expireSessionToken,
} from '@/lib/session-storage'
import type { Nft } from '@/modules/nft/domain/nft.contracts'
import type { FavoritesResponse } from '@/modules/favorites/domain/favorites.contracts'
import type { LoginInput, RegisterInput } from '@/modules/auth/domain/auth.contracts'
import type { CreateOrderInput } from '@/modules/orders/domain/order.contracts'

export function useMarketplace() {
  const api = useRepositories()
  const token = useSyncExternalStore(subscribeSession, getSessionToken, () => null)
  return { api, token, queries: createQueries(api, token, getGuestCartId()) }
}
export function useSession() {
  const { queries, token } = useMarketplace()
  const session = useQuery(queries.session())
  useEffect(() => {
    const expiry = session.data?.session.expiresAt
    if (!expiry || !token) return
    const timer = setTimeout(
      () => expireSessionToken(token),
      Math.max(0, Date.parse(expiry) - Date.now())
    )
    return () => clearTimeout(timer)
  }, [session.data?.session.expiresAt, token])
  return session
}
export function useAuthentication(mode: 'login' | 'register') {
  const { api } = useMarketplace()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput | RegisterInput) =>
      mode === 'register' ? api.auth.register(input as RegisterInput) : api.auth.login(input),
    onSuccess: (result) => {
      setSessionToken(result.session.token)
      client.setQueryData(keys.session(result.session.token), result)
    },
  })
}
export function useLogout() {
  const { api, token } = useMarketplace()
  return useMutation({
    mutationFn: () => api.auth.logout({ sessionToken: token }),
    onMutate: () => {
      if (getSessionToken() === token) setSessionToken(null)
    },
    onSettled: () => {
      if (getSessionToken() === token) setSessionToken(null)
    },
  })
}
export function useFavorite() {
  const { api, token, queries } = useMarketplace()
  const client = useQueryClient()
  const key = queries.favorites().queryKey
  return useMutation({
    scope: { id: `favorites:${queries.scope}` },
    mutationKey: ['favorites', queries.scope],
    mutationFn: ({ nft, selected }: { nft: Nft; selected: boolean }) =>
      api.favorites.set(nft.id, selected, { sessionToken: token }),
    onMutate: async ({ nft, selected }) => {
      await client.cancelQueries({ queryKey: key })
      if (getSessionToken() !== token) return undefined
      const previous = client.getQueryData<FavoritesResponse>(key)
      client.setQueryData<FavoritesResponse>(key, (current) => ({
        items: (current?.items ?? [])
          .filter((item) => item.id !== nft.id)
          .concat(selected ? [nft] : []),
      }))
      return { previous, nftId: nft.id }
    },
    onError: (_error, _variables, rollback) => {
      if (getSessionToken() !== token || !rollback) return
      client.setQueryData<FavoritesResponse>(key, (current) => ({
        items: (current?.items ?? [])
          .filter((item) => item.id !== rollback.nftId)
          .concat(rollback.previous?.items.filter((item) => item.id === rollback.nftId) ?? []),
      }))
    },
    onSuccess: (data) => {
      if (
        getSessionToken() === token &&
        client.isMutating({ mutationKey: ['favorites', queries.scope] }) === 1
      )
        client.setQueryData(key, data)
    },
    onSettled: () => {
      if (
        getSessionToken() === token &&
        client.isMutating({ mutationKey: ['favorites', queries.scope] }) === 1
      )
        return client.invalidateQueries({ queryKey: key })
    },
  })
}
export function useCreateOrder() {
  const { api, token, queries } = useMarketplace()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.orders.create(input, { sessionToken: token }),
    onSuccess: async (order) => {
      if (getSessionToken() !== token) return
      client.setQueryData(queries.order(order.id).queryKey, order)
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.private(queries.scope) }),
        client.invalidateQueries({ queryKey: keys.nfts }),
      ])
    },
  })
}
