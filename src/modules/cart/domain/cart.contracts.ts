import type { NetworkId } from '@/modules/nft/domain/nft.contracts'

/** Item do carrinho: preço e disponibilidade sempre vêm da API. */
export interface CartItem {
  nftId: string
  name: string
  imageUrl: string
  network: NetworkId
  unitPriceEth: string
  quantity: number
  available: number
  maxPerOrder: number
}

export interface Cart {
  items: CartItem[]
  itemCount: number
  updatedAt: string
}

export interface AddCartItemInput {
  nftId: string
  quantity: number
}

export interface UpdateCartItemInput {
  quantity: number
}
