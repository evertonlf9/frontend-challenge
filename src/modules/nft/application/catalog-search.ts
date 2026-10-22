import {
  NETWORK_IDS,
  NFT_SORT_FIELDS,
  type NftListParams,
  type NetworkId,
  type NftSortField,
} from '../domain/nft.contracts'

export function catalogSearch(search: Record<string, unknown>): NftListParams {
  const integer = (value: unknown, fallback: number, max: number) =>
    Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= max
      ? Number(value)
      : fallback
  const decimal = (value: unknown) =>
    typeof value === 'string' && /^\d+(\.\d{1,18})?$/.test(value) ? value : undefined
  return {
    view: ['all', 'new', 'trending'].includes(String(search.view))
      ? (search.view as NftListParams['view'])
      : 'all',
    search: typeof search.search === 'string' ? search.search.slice(0, 200) : undefined,
    collection: typeof search.collection === 'string' ? search.collection : undefined,
    network: NETWORK_IDS.includes(search.network as NetworkId)
      ? (search.network as NetworkId)
      : undefined,
    sort: NFT_SORT_FIELDS.includes(search.sort as NftSortField)
      ? (search.sort as NftSortField)
      : 'recent',
    minPrice: decimal(search.minPrice),
    maxPrice: decimal(search.maxPrice),
    page: integer(search.page, 1, 100_000),
    pageSize: integer(search.pageSize, 9, 24),
  }
}
