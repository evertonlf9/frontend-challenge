import type { Profile } from '@/modules/profile/domain/profile.contracts'
import type { Wallet } from '@/modules/wallets/domain/wallet.contracts'
import type { Order } from '@/modules/orders/domain/order.contracts'
import type { Nft } from '@/modules/nft/domain/nft.contracts'
import type { Coupon } from '@/modules/checkout/domain/quote.contracts'
import type { Quote } from '@/modules/checkout/domain/quote.contracts'
import type { MockScenarioId } from '../scenarios'

export interface MockUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface MockSession {
  token: string
  userId: string
  expiresAt: string
}

export interface MockIdempotencyRecord {
  fingerprint: string
  orderId: string
  timedOut?: boolean
}

export interface MockCartLine {
  nftId: string
  quantity: number
}

export interface MockState {
  revision: number
  scenario: MockScenarioId
  users: MockUser[]
  sessions: MockSession[]
  nfts: Nft[]
  coupons: Coupon[]
  profiles: Record<string, Profile>
  wallets: Record<string, Wallet[]>
  favorites: Record<string, string[]>
  carts: Record<string, MockCartLine[]>
  orders: Order[]
  orderOwners: Record<string, string>
  idempotency: Record<string, MockIdempotencyRecord>
  quotes: Record<string, { owner: string; quote: Quote }>
  counters: Record<string, number>
}
