import { addEth, compareEth, mulEth, subEth } from '@/lib/money'
import type { AuthResponse } from '@/modules/auth/domain/auth.contracts'
import type { Cart } from '@/modules/cart/domain/cart.contracts'
import type { Quote } from '@/modules/checkout/domain/quote.contracts'
import type { Nft, NftListResponse } from '@/modules/nft/domain/nft.contracts'
import type { Order } from '@/modules/orders/domain/order.contracts'
import type { Profile } from '@/modules/profile/domain/profile.contracts'
import type { MarketplaceEvent } from '@/modules/shared/domain/events'
import type { Wallet } from '@/modules/wallets/domain/wallet.contracts'
import { array, boolean, decimal, identifier, imageUrl, integer, nullable, object, oneOf, optional, refine, resourceUrl, string, timestamp, type Decoder } from './decoder'

const network = oneOf(['ethereum', 'polygon', 'solana'])
const provider = oneOf(['MetaMask', 'WalletConnect', 'Coinbase Wallet'])
const avatar: Decoder<string> = (value, path) => value === '' ? '' : imageUrl(value, path)

export const authResponse: Decoder<AuthResponse> = refine(object({
  account: object({ id: identifier, name: identifier, email: identifier, createdAt: timestamp }),
  session: object({ token: identifier, userId: identifier, expiresAt: timestamp }),
}), (value) => value.account.id === value.session.userId)

export const nftResponse: Decoder<Nft> = object({
  id: identifier, name: identifier, description: string, collection: identifier, network,
  priceEth: decimal, previousPriceEth: nullable(decimal), available: integer(), maxPerOrder: integer(1),
  popularity: optional(integer()), rarity: string, attributes: array(object({ trait: string, value: string })),
  imageUrl, galleryUrls: array(imageUrl), creator: object({ handle: string, avatarUrl: avatar }),
  contractAddress: identifier, tokenId: identifier, updatedAt: timestamp, version: integer(1),
})
export const nftListResponse: Decoder<NftListResponse> = object({
  items: array(nftResponse), page: integer(1), pageSize: integer(1, 24), total: integer(), totalPages: integer(),
  collections: array(object({ name: identifier, count: integer() })), networks: array(object({ id: network, count: integer() })),
  priceRange: refine(object({ min: decimal, max: decimal }), (range) => compareEth(range.min, range.max) <= 0),
})
export const favoritesResponse = object({ items: array(nftResponse) })
export const cartResponse: Decoder<Cart> = refine(object({
  items: array(object({ nftId: identifier, name: identifier, imageUrl, network, unitPriceEth: decimal, quantity: integer(1), available: integer(), maxPerOrder: integer(1) })),
  itemCount: integer(), updatedAt: timestamp,
}), (cart) => cart.itemCount === cart.items.reduce((sum, line) => sum + line.quantity, 0))

const quoteLine = { nftId: identifier, name: identifier, network, unitPriceEth: decimal, quantity: integer(1), subtotalEth: decimal }
const totals = { subtotalEth: decimal, discountEth: decimal, networkFeeEth: decimal, totalEth: decimal }
function coherentTotals(value: { items: { unitPriceEth: string; quantity: number; subtotalEth: string }[]; subtotalEth: string; discountEth: string; networkFeeEth: string; totalEth: string }): boolean {
  return value.items.length > 0 && value.items.every((line) => compareEth(mulEth(line.unitPriceEth, line.quantity), line.subtotalEth) === 0)
    && compareEth(addEth(...value.items.map((line) => line.subtotalEth)), value.subtotalEth) === 0
    && compareEth(value.discountEth, value.subtotalEth) <= 0
    && compareEth(addEth(subEth(value.subtotalEth, value.discountEth), value.networkFeeEth), value.totalEth) === 0
}
export const quoteResponse: Decoder<Quote> = refine(object({
  id: identifier, items: array(object(quoteLine)), ...totals,
  coupon: nullable(object({ code: identifier, description: string, percentOff: integer(0, 100), expiresAt: timestamp })), couponCode: nullable(identifier),
  availability: array(object({ nftId: identifier, requested: integer(1), available: integer(), status: oneOf(['ok', 'insufficient', 'unavailable']) })),
  issuedAt: timestamp, expiresAt: timestamp,
}), coherentTotals)
export const orderResponse: Decoder<Order> = refine(object({
  id: identifier, status: oneOf(['pending', 'confirmed', 'declined']), items: array(object({ ...quoteLine, imageUrl })), ...totals,
  couponCode: nullable(identifier), walletId: identifier, walletAddress: identifier, network,
  collector: object({ name: identifier, email: identifier, handle: optional(string), profileName: optional(string), referralCode: optional(string), ensName: optional(string), note: optional(string), secondaryWalletAddress: optional(string), walletProvider: optional(provider) }),
  transactionRef: nullable(identifier), explorerUrl: nullable(resourceUrl), failureReason: nullable(string), idempotencyKey: identifier,
  createdAt: timestamp, updatedAt: timestamp, version: integer(1),
}), (order) => coherentTotals(order) && (order.status !== 'confirmed' || !!order.transactionRef))
export const orderListResponse = object({ items: array(orderResponse) })
export const profileResponse: Decoder<Profile> = object({
  id: identifier, name: identifier, email: identifier, handle: identifier, bio: string, avatarUrl: avatar,
  walletLabel: optional(string), ensName: optional(string), usePrimaryForSecondary: optional(boolean), updatedAt: timestamp,
})
export const walletResponse: Decoder<Wallet> = object({
  id: identifier, label: identifier, address: identifier, network, isPrimary: boolean, verified: boolean, createdAt: timestamp, updatedAt: timestamp,
  displayName: optional(string), profileName: optional(string), email: optional(string), provider: optional(provider), referralCode: optional(string), ensName: optional(string), secondaryAddress: optional(string),
})
export const walletListResponse = object({ items: array(walletResponse) })
export const connectionResponse = object({ walletId: identifier, network })

const eventIdentity = { id: identifier, resourceId: identifier, version: integer(1) }
const nftEvent = object({ ...eventIdentity, type: oneOf(['nft.updated']), data: nftResponse })
const orderEvent = object({ ...eventIdentity, type: oneOf(['order.updated']), userId: identifier, data: orderResponse })
export const marketplaceEvent: Decoder<MarketplaceEvent> = refine((value, path) => {
  const { type } = object({ type: oneOf(['nft.updated', 'order.updated']) })(value, path)
  return type === 'nft.updated' ? nftEvent(value, path) : orderEvent(value, path)
}, (event) => event.resourceId === event.data.id && event.version === event.data.version)
