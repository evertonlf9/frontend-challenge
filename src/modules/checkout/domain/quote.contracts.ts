import type { NetworkId } from '@/modules/nft/domain/nft.contracts'

export interface QuoteLine {
  nftId: string
  name: string
  network: NetworkId
  unitPriceEth: string
  quantity: number
  subtotalEth: string
}

export interface Coupon {
  code: string
  description: string
  percentOff: number
  expiresAt: string
}

export interface QuoteAvailability {
  nftId: string
  requested: number
  available: number
  status: 'ok' | 'insufficient' | 'unavailable'
}

/** Cotação é a fonte de verdade para finalizar o pedido. */
export interface Quote {
  id: string
  items: QuoteLine[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: Coupon | null
  couponCode: string | null
  availability: QuoteAvailability[]
  issuedAt: string
  /** Após este instante a cotação é considerada desatualizada. */
  expiresAt: string
}

export interface QuoteInput {
  items: { nftId: string; quantity: number }[]
  couponCode?: string | null
}
