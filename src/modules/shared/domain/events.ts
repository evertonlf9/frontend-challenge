import type { Nft } from '@/modules/nft/domain/nft.contracts'
import type { Order } from '@/modules/orders/domain/order.contracts'

export type MarketplaceEvent =
  | { id: string; type: 'nft.updated'; resourceId: string; version: number; data: Nft }
  | { id: string; type: 'order.updated'; resourceId: string; userId: string; version: number; data: Order }
