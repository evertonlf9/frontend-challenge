import { describeArtwork } from '../artwork-description'
import { artworkImage } from '../artwork-image'
import { useState } from 'react'
import type { NftListParams, NftListResponse } from '../../domain/nft.contracts'
import { Button } from '@/components/ui/button'

interface Props { search: NftListParams; data?: NftListResponse; onChange: (values: Partial<NftListParams>) => void; onReset: () => void }
export function CatalogFilters({ search, data, onChange, onReset }: Props) {
  const [minimum, setMinimum] = useState(search.minPrice ?? '0.02')
  const [maximum, setMaximum] = useState(search.maxPrice ?? '12.30')
  const [error, setError] = useState('')
  const [appliedRange, setAppliedRange] = useState({ minimum: search.minPrice, maximum: search.maxPrice })
  if (appliedRange.minimum !== search.minPrice || appliedRange.maximum !== search.maxPrice) {
    setAppliedRange({ minimum: search.minPrice, maximum: search.maxPrice })
    setMinimum(search.minPrice ?? '0.02')
    setMaximum(search.maxPrice ?? '12.30')
    setError('')
  }
  const networks = [{ id: 'ethereum', label: 'Ethereum' }, { id: 'polygon', label: 'Polygon' }, { id: 'solana', label: 'Solana' }] as const
  return <aside className="catalog-sidebar" aria-label="Filtros do catálogo">
    <div className="filter-panel">
      <section className="filter-group"><h2>Coleções</h2><ul className="filter-list">{data?.collections.map((collection) => <li key={collection.name}><button aria-pressed={search.collection === collection.name} onClick={() => onChange({ collection: search.collection === collection.name ? undefined : collection.name })}>{collection.name}</button><span>({collection.count})</span></li>)}</ul></section>
      <form className="filter-group" onSubmit={(event) => {
        event.preventDefault()
        if (!/^\d+(\.\d{1,18})?$/.test(minimum) || !/^\d+(\.\d{1,18})?$/.test(maximum) || Number(minimum) > Number(maximum)) { setError('Informe uma faixa de preço válida.'); return }
        setError(''); onChange({ minPrice: minimum, maxPrice: maximum })
      }}>
        <h2>Faixa de preço</h2><div className="price-slider">
          <input aria-label="Ajustar preço mínimo" type="range" min="0.02" max="12.30" step="0.01" value={minimum} onChange={(event) => setMinimum(String(Math.min(Number(event.target.value), Number(maximum))))} />
          <input aria-label="Ajustar preço máximo" type="range" min="0.02" max="12.30" step="0.01" value={maximum} onChange={(event) => setMaximum(String(Math.max(Number(event.target.value), Number(minimum))))} />
        </div>
        <div className="price-values"><span>Preço:</span><input aria-label="Preço mínimo" inputMode="decimal" value={minimum} onChange={(event) => setMinimum(event.target.value)} /><span>–</span><input aria-label="Preço máximo" inputMode="decimal" value={maximum} onChange={(event) => setMaximum(event.target.value)} /><span>ETH</span></div>
        <Button type="submit" className="price-apply">Aplicar</Button>{error && <p role="alert">{error}</p>}
      </form>
      <section className="filter-group"><h2>Rede</h2><ul className="filter-list">{networks.map((network) => <li key={network.id}><button aria-pressed={search.network === network.id} onClick={() => onChange({ network: search.network === network.id ? undefined : network.id })}>{network.label}</button><span>({data?.networks.find((item) => item.id === network.id)?.count ?? 0})</span></li>)}</ul></section>
      {(search.search || search.collection || search.network || search.minPrice || search.maxPrice) && <button className="filter-reset" onClick={onReset}>Limpar filtros</button>}
    </div>
    <section className="featured-card"><h2>NFT EM DESTAQUE</h2><h3>OFERTA LIMITADA</h3><img src="/artwork/sage.webp" {...artworkImage('/artwork/sage.webp', '280px')} alt={describeArtwork('/artwork/sage.webp', 'Sage Nomad, NFT em destaque')} width={280} height={330} loading="lazy" /></section>
  </aside>
}
