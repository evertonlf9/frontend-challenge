import type { NetworkId } from '@/modules/nft/domain/nft.contracts'

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const

export interface CollectorDetails {
  name: string
  email: string
  handle?: string
  profileName?: string
  referralCode?: string
  ensName?: string
  note?: string
  secondaryWalletAddress?: string
  walletProvider?: string
}

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Snapshot do item no instante do pedido: imutável após a criação. */
export interface OrderItemSnapshot {
  nftId: string
  name: string
  imageUrl: string
  network: NetworkId
  unitPriceEth: string
  quantity: number
  subtotalEth: string
}

export interface Order {
  id: string
  status: OrderStatus
  items: OrderItemSnapshot[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  couponCode: string | null
  walletId: string
  walletAddress: string
  network: NetworkId
  collector: CollectorDetails
  transactionRef: string | null
  explorerUrl: string | null
  failureReason: string | null
  /** Chave de idempotência que originou o pedido. */
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface CreateOrderInput {
  quoteId: string
  items: { nftId: string; quantity: number }[]
  walletId: string
  network: NetworkId
  couponCode?: string | null
  collector: CollectorDetails
  /** Chave de idempotência: repetir a tentativa devolve o mesmo pedido. */
  idempotencyKey: string
}

export interface OrderListResponse {
  items: Order[]
}
