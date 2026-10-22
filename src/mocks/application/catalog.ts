import { compareEth } from '@/lib/money'
import { NETWORK_IDS, NFT_SORT_FIELDS, type NftListResponse, type NftSortField } from '@/modules/nft/domain/nft.contracts'
import type { MockStore } from '../domain/store'
import { fail, invalid } from './validation'

export function createCatalog(store: MockStore) {
  return {
    get(id: string) {
      const nft = store.read().nfts.find((item) => item.id === id)
      if (!nft) fail('NOT_FOUND', 404, 'NFT não encontrado.')
      return structuredClone(nft)
    },
    list(params: URLSearchParams): NftListResponse {
      const positive = (key: string, fallback: number, max: number) => {
        const raw = params.get(key)
        if (raw == null) return fallback
        const number = Number(raw)
        if (!Number.isSafeInteger(number) || number < 1 || number > max) invalid(key, 'Parâmetro inteiro fora dos limites.')
        return number
      }
      const page = positive('page', 1, 100_000)
      const pageSize = positive('pageSize', 9, 24)
      const sort = params.get('sort') ?? 'recent'
      if (!(NFT_SORT_FIELDS as readonly string[]).includes(sort)) invalid('sort', 'Ordenação inválida.')
      const chain = params.get('network')
      if (chain && !(NETWORK_IDS as readonly string[]).includes(chain)) invalid('network', 'Rede inválida.')
      const min = params.get('minPrice')
      const max = params.get('maxPrice')
      for (const value of [min, max]) if (value && !/^\d+(\.\d{1,18})?$/.test(value)) invalid('price', 'Preço decimal inválido.')
      if (min && max && compareEth(min, max) > 0) invalid('minPrice', 'Preço mínimo maior que o máximo.')
      const all = store.read().nfts
      const view = params.get("view") ?? "all"
      if (!["all", "new", "trending"].includes(view)) invalid("view", "Seleção inválida.")
      const latest = Math.max(...all.map((nft) => Date.parse(nft.updatedAt)))
      const pool = view === "new" ? all.filter((nft) => Date.parse(nft.updatedAt) >= latest - 6 * 60 * 60_000) : view === "trending" ? [...all].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, 12) : all
      const search = (params.get('search') ?? '').trim().toLocaleLowerCase('pt-BR')
      const filtered = pool.filter((nft) => (!search || `${nft.name} ${nft.collection}`.toLocaleLowerCase('pt-BR').includes(search)) && (!chain || nft.network === chain) && (!params.get('collection') || nft.collection === params.get('collection')) && (!min || compareEth(nft.priceEth, min) >= 0) && (!max || compareEth(nft.priceEth, max) <= 0))
      const sorters: Record<NftSortField, (a: (typeof all)[number], b: (typeof all)[number]) => number> = { recent: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt), 'price-asc': (a, b) => compareEth(a.priceEth, b.priceEth), 'price-desc': (a, b) => compareEth(b.priceEth, a.priceEth), 'name-asc': (a, b) => a.name.localeCompare(b.name, 'pt-BR') }
      filtered.sort(sorters[sort as NftSortField])
      const items = store.read().scenario === 'empty-catalog' ? [] : filtered
      return { items: structuredClone(items.slice((page - 1) * pageSize, page * pageSize)), page, pageSize, total: items.length, totalPages: Math.ceil(items.length / pageSize), collections: [...new Set(all.map((nft) => nft.collection))].map((name) => ({ name, count: all.filter((nft) => nft.collection === name).length })), networks: NETWORK_IDS.map((id) => ({ id, count: all.filter((nft) => nft.network === id).length })), priceRange: { min: all.reduce((min, nft) => compareEth(nft.priceEth, min) < 0 ? nft.priceEth : min, all[0]?.priceEth ?? "0"), max: all.reduce((max, nft) => compareEth(nft.priceEth, max) > 0 ? nft.priceEth : max, "0") } }
    },
  }
}
