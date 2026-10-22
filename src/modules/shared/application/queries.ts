import { queryOptions } from '@tanstack/react-query'
import type { MarketplaceRepositories } from '../domain/repositories'
import type { NftListParams } from '@/modules/nft/domain/nft.contracts'
import type { QuoteInput } from '@/modules/checkout/domain/quote.contracts'

export const keys = {
  session: (token: string | null) => ['session', token] as const,
  nfts: ['nfts'] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
  private: (scope: string) => ['private', scope] as const,
  resource: (scope: string, name: string) => ['private', scope, name] as const,
}

export function createQueries(api: MarketplaceRepositories, token: string | null, guestId: string) {
  const scope = token ?? `guest:${guestId}`
  const context = { sessionToken: token }
  return {
    scope,
    session: () =>
      queryOptions({
        queryKey: keys.session(token),
        queryFn: ({ signal }) => api.auth.session({ ...context, signal }),
        enabled: !!token,
        staleTime: 0,
        retry: false,
      }),
    nfts: (params: NftListParams) =>
      queryOptions({
        queryKey: [...keys.nfts, 'list', params],
        queryFn: ({ signal }) => api.nfts.list(params, { signal, sessionToken: null }),
      }),
    nft: (id: string) =>
      queryOptions({
        queryKey: keys.detail(id),
        queryFn: ({ signal }) => api.nfts.get(id, { signal, sessionToken: null }),
      }),
    favorites: () =>
      queryOptions({
        queryKey: keys.resource(scope, 'favorites'),
        queryFn: ({ signal }) => api.favorites.list({ ...context, signal }),
        enabled: !!token,
      }),
    cart: () =>
      queryOptions({
        queryKey: keys.resource(scope, 'cart'),
        queryFn: ({ signal }) => api.cart.get({ ...context, signal }),
      }),
    quote: (input: QuoteInput) =>
      queryOptions({
        queryKey: [...keys.resource(scope, 'quote'), input],
        queryFn: ({ signal }) => api.quote.create(input, { ...context, signal }),
        enabled: input.items.length > 0,
        staleTime: 0,
      }),
    orders: () =>
      queryOptions({
        queryKey: keys.resource(scope, 'orders'),
        queryFn: ({ signal }) => api.orders.list({ ...context, signal }),
        enabled: !!token,
      }),
    order: (id: string) =>
      queryOptions({
        queryKey: [...keys.resource(scope, 'orders'), id],
        queryFn: ({ signal }) => api.orders.get(id, { ...context, signal }),
        enabled: !!token && !!id,
        refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2_000 : false),
      }),
    profile: () =>
      queryOptions({
        queryKey: keys.resource(scope, 'profile'),
        queryFn: ({ signal }) => api.profile.get({ ...context, signal }),
        enabled: !!token,
      }),
    wallets: () =>
      queryOptions({
        queryKey: keys.resource(scope, 'wallets'),
        queryFn: ({ signal }) => api.wallets.list({ ...context, signal }),
        enabled: !!token,
      }),
  }
}
