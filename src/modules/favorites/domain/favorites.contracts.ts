import type { Nft } from '@/modules/nft/domain/nft.contracts'

/** Favoritos persistidos por usuário autenticado. */
export interface FavoritesResponse {
  items: Nft[]
}

export interface FavoriteToggleInput {
  nftId: string
}
