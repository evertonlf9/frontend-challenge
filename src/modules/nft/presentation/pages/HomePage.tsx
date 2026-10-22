import { HomeHero } from '../components/HomeHero'
import { artworkImage } from '../artwork-image'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useMarketplace } from '@/modules/shared/application/use-marketplace'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/button'
import { NftCard } from '../components/NftCard'
import { CatalogFilters } from '../components/CatalogFilters'
import { MarketplaceEditorial } from '../components/MarketplaceEditorial'
import type { NftListParams } from '../../domain/nft.contracts'

import { catalogSearch } from '../../application/catalog-search'

export function HomePage({ catalogParams }: { catalogParams?: NftListParams } = {}) {
  const routeSearch = useSearch({ strict: false })
  const search = catalogParams ?? catalogSearch(routeSearch)
  const navigate = useNavigate({ from: '/' })
  const { queries } = useMarketplace()
  const query = useQuery({ ...queries.nfts(search), placeholderData: keepPreviousData })
  const change = (values: Partial<NftListParams>) => void navigate({ to: '/', resetScroll: false, hashScrollIntoView: false, search: { ...search, ...values, page: values.page ?? 1 } })
  const explore = () => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  return <>
    <HomeHero onExplore={explore} />
    <section id="catalogo" className="catalog-layout" aria-label="Mercado de NFTs">
      <CatalogFilters search={search} data={query.data} onChange={change} onReset={() => void navigate({ search: {} })} />
      <div className="catalog-content">
        <div className="catalog-toolbar">
          <nav className="catalog-tabs" aria-label="Seleção do catálogo">
            <button aria-pressed={!search.view || search.view === 'all'} onClick={() => change({ view: 'all' })}>Todos os NFTs</button>
            <button aria-pressed={search.view === 'new'} onClick={() => change({ view: 'new', sort: 'recent' })}>Novos lançamentos</button>
            <button aria-pressed={search.view === 'trending'} onClick={() => change({ view: 'trending' })}>Em alta</button>
          </nav>
          <label className="catalog-sort">Ordenar por:<select aria-label="Ordenar por" value={search.sort} onChange={(event) => change({ sort: event.target.value as NftListParams['sort'] })}><option value="recent">Listados recentemente</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="name-asc">Nome</option></select></label>
        </div>
        <QueryFeedback query={query} empty={query.data?.items.length === 0} variant="catalog" />
        <div className="nft-grid" role="region" aria-label="Catálogo">{query.data?.items.map((nft) => <NftCard key={nft.id} {...nft} price={nft.priceEth} oldPrice={nft.previousPriceEth ?? undefined} />)}</div>
        <Pagination currentPage={search.page ?? 1} totalPages={query.data?.totalPages ?? 0} onPageChange={(page) => change({ page })} />
      </div>
    </section>
    <section className="promo-grid" aria-label="Coleções em destaque">{[
      { image: 'emerald', title: 'Lançamentos gênesis de edição limitada', text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.', view: 'new' as const },
      { image: 'neon', title: 'Arte digital selecionada e muito mais', text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.', view: 'trending' as const },
    ].map((promo) => <article className="promo-card" key={promo.image}><img src={`/artwork/${promo.image}.webp`} {...artworkImage(`/artwork/${promo.image}.webp`, '(max-width: 767px) 45vw, 260px')} alt={promo.title} width={260} height={224} loading="lazy" /><div className="promo-copy"><h2>{promo.title}</h2><p>{promo.text}</p><Button onClick={() => { change({ view: promo.view }); explore() }}>Explorar <ArrowRight size={16} aria-hidden="true" /></Button></div></article>)}</section>
    <MarketplaceEditorial />
  </>
}
