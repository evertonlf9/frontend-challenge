/**
 * Contratos do recurso NFT (catálogo e detalhe).
 * Valores monetários em ETH trafegam como string decimal (quantidades inteiras).
 */
export const NETWORK_IDS = ['ethereum', 'polygon', 'solana'] as const

export type NetworkId = (typeof NETWORK_IDS)[number]

export interface NftAttribute {
  trait: string
  value: string
}

export interface NftCreator {
  handle: string
  avatarUrl: string
}

export interface Nft {
  id: string
  name: string
  description: string
  collection: string
  network: NetworkId
  /** Preço atual em ETH, string decimal. */
  priceEth: string
  /** Preço anterior quando há promoção; `null` caso contrário. */
  previousPriceEth: string | null
  /** Edições disponíveis para compra. */
  available: number
  /** Limite de unidades por pedido. */
  maxPerOrder: number
  popularity?: number
  rarity: string
  attributes: NftAttribute[]
  imageUrl: string
  galleryUrls: string[]
  creator: NftCreator
  contractAddress: string
  tokenId: string
  updatedAt: string
  /** Incrementado a cada alteração; usado para descartar eventos antigos. */
  version: number
}

export const NFT_SORT_FIELDS = ['recent', 'price-asc', 'price-desc', 'name-asc'] as const

export type NftSortField = (typeof NFT_SORT_FIELDS)[number]

/** Parâmetros de listagem: espelham a query string da URL. */
export interface NftListParams {
  view?: 'all' | 'new' | 'trending'
  search?: string
  collection?: string
  network?: NetworkId
  minPrice?: string
  maxPrice?: string
  sort?: NftSortField
  page?: number
  pageSize?: number
}

/** Envelope padrão de listagens paginadas. */
export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface NftCollectionSummary {
  name: string
  count: number
}

export interface NftListResponse extends Paginated<Nft> {
  collections: NftCollectionSummary[]
  networks: { id: NetworkId; count: number }[]
  /** Faixa de preço disponível no catálogo, usada pelos filtros da UI. */
  priceRange: { min: string; max: string }
}
