import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/http'
import type { MarketplaceRepositories, RequestContext } from '@/modules/shared/domain/repositories'
import { response } from './decoder'
import * as contracts from './response-contracts'

function config(context?: RequestContext) {
  return { signal: context?.signal, headers: context?.sessionToken !== undefined ? { Authorization: context.sessionToken ? `Bearer ${context.sessionToken}` : '' } : undefined }
}
const id = encodeURIComponent

/** Adaptadores HTTP; regras de estado e negócio não pertencem ao transporte. */
export const repositories: MarketplaceRepositories = {
  auth: {
    login: (input) => response(contracts.authResponse, apiPost('/auth/login', input)),
    register: (input) => response(contracts.authResponse, apiPost('/auth/register', input)),
    session: (context) => response(contracts.authResponse, apiGet('/auth/session', config(context))),
    logout: (context) => apiPost('/auth/logout', undefined, config(context)),
  },
  nfts: { list: (params, context) => response(contracts.nftListResponse, apiGet('/nfts', { ...config(context), params })), get: (nftId, context) => response(contracts.nftResponse, apiGet(`/nfts/${id(nftId)}`, config(context))) },
  favorites: {
    list: (context) => response(contracts.favoritesResponse, apiGet('/favorites', config(context))),
    set: (nftId, selected, context) => response(contracts.favoritesResponse, selected ? apiPost('/favorites', { nftId }, config(context)) : apiDelete(`/favorites/${id(nftId)}`, config(context))),
  },
  cart: {
    get: (context) => response(contracts.cartResponse, apiGet('/cart', config(context))),
    add: (input, context) => response(contracts.cartResponse, apiPost('/cart/items', input, config(context))),
    update: (nftId, input, context) => response(contracts.cartResponse, apiPatch(`/cart/items/${id(nftId)}`, input, config(context))),
    remove: (nftId, context) => response(contracts.cartResponse, apiDelete(`/cart/items/${id(nftId)}`, config(context))),
  },
  quote: { create: (input, context) => response(contracts.quoteResponse, apiPost('/quote', input, config(context))) },
  orders: {
    list: (context) => response(contracts.orderListResponse, apiGet('/orders', config(context))),
    get: (orderId, context) => response(contracts.orderResponse, apiGet(`/orders/${id(orderId)}`, config(context))),
    create: (input, context) => response(contracts.orderResponse, apiPost('/orders', input, { ...config(context), headers: { ...config(context).headers, 'Idempotency-Key': input.idempotencyKey } })),
  },
  profile: {
    get: (context) => response(contracts.profileResponse, apiGet('/profile', config(context))),
    update: (input, context) => response(contracts.profileResponse, apiPatch('/profile', input, config(context))),
    changePassword: (input, context) => apiPut('/profile/password', input, config(context)),
  },
  wallets: {
    connect: (walletId, network, context) => response(contracts.connectionResponse, apiPost(`/wallets/${id(walletId)}/connect`, { network }, config(context))),
    disconnect: (walletId, context) => apiPost(`/wallets/${id(walletId)}/disconnect`, undefined, config(context)),
    list: (context) => response(contracts.walletListResponse, apiGet('/wallets', config(context))),
    create: (input, context) => response(contracts.walletResponse, apiPost('/wallets', input, config(context))),
    update: (walletId, input, context) => response(contracts.walletResponse, apiPatch(`/wallets/${id(walletId)}`, input, config(context))),
  },
}
