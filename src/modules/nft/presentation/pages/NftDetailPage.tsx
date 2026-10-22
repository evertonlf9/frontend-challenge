import { describeArtwork } from '../artwork-description'
import { artworkImage } from '../artwork-image'
import { DETAIL_IMAGE_SIZES } from '../preload-artwork'
import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Share2, Star, Check, Info, MessageSquare } from 'lucide-react'
import { useFavorite, useMarketplace } from '@/modules/shared/application/use-marketplace'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { QuantityControl } from '@/components/ui/QuantityControl'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { RelatedNfts } from '../components/RelatedNfts'
import { getSessionToken } from '@/lib/session-storage'

export function NftDetailPage() {
  const { id } = useParams({ from: '/nft/$id' })
  const { queries, token, api } = useMarketplace()
  const query = useQuery(queries.nft(id))
  const favorites = useQuery(queries.favorites())
  const favorite = useFavorite()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const [shareStatus, setShareStatus] = useState('')
  const [tab, setTab] = useState<'details' | 'reviews'>('details')
  const add = useMutation({
    mutationFn: () => api.cart.add({ nftId: id, quantity }, { sessionToken: token }),
    onSuccess: async () => {
      if (getSessionToken() !== token) return
      await client.invalidateQueries({ queryKey: queries.cart().queryKey })
      await navigate({ to: '/cart' })
    },
  })
  if (!query.data)
    return (
      <section className="page-shell">
        <QueryFeedback query={query} variant="detail" />
      </section>
    )
  const nft = query.data
  const selected = favorites.data?.items.some((item) => item.id === id) ?? false
  const limit = Math.min(nft.available, nft.maxPerOrder)
  const share = () =>
    void navigator.clipboard.writeText(window.location.href).then(
      () => setShareStatus('Link copiado.'),
      () => setShareStatus('Não foi possível copiar o link.')
    )
  return (
    <section className="page-shell nft-detail">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: nft.name }]}
      />
      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-thumbnails">
            {nft.galleryUrls.map((image, index) => (
              <button
                key={index}
                aria-label={`Ver imagem ${index + 1}`}
                aria-pressed={imageIndex === index}
                aria-describedby={`${nft.id}-thumb-${index}`}
                onClick={() => setImageIndex(index)}
              >
                <img
                  id={`${nft.id}-thumb-${index}`}
                  src={image}
                  {...artworkImage(image, '70px')}
                  alt={describeArtwork(image, nft.name)}
                  width={70}
                  height={70}
                />
              </button>
            ))}
          </div>
          <div className="detail-main-art">
            <img
              src={nft.galleryUrls[imageIndex] ?? nft.imageUrl}
              {...artworkImage(nft.galleryUrls[imageIndex] ?? nft.imageUrl, DETAIL_IMAGE_SIZES)}
              alt={describeArtwork(nft.galleryUrls[imageIndex] ?? nft.imageUrl, nft.name)}
              width={430}
              height={430}
              fetchPriority="high"
            />
          </div>
        </div>
        <div className="detail-info">
          <h1>{nft.name}</h1>
          <div className="detail-price" data-reading-target>
            <span>{nft.priceEth} ETH</span>
            {nft.previousPriceEth && (
              <span className="nft-old-price">{nft.previousPriceEth} ETH</span>
            )}
          </div>
          <div className="detail-meta" data-reading-target>
            <span className="detail-stars" role="img" aria-label="Obra em destaque">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} size={13} fill="currentColor" aria-hidden="true" />
              ))}
            </span>
            <span>
              <Check size={12} aria-hidden="true" />
              {nft.available > 0 ? 'Edição disponível' : 'Edição esgotada'}
            </span>
          </div>
          <p className="detail-description">{nft.description}</p>
          <div className="creator-chip" data-reading-target>
            <img
              src={nft.creator.avatarUrl}
              {...artworkImage(nft.creator.avatarUrl, '28px')}
              alt=""
              width={28}
              height={28}
            />
            <span>
              Criado por <strong>{nft.creator.handle}</strong>
            </span>
          </div>
          <dl className="detail-attributes">
            <div>
              <dt>Coleção</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div>
              <dt>Rede</dt>
              <dd>{nft.network}</dd>
            </div>
            <div>
              <dt>ID do token</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div>
              <dt>Raridade</dt>
              <dd>{nft.rarity}</dd>
            </div>
          </dl>
          <div className="detail-purchase-options">
            <label>
              Edição
              <select aria-label="Edição" defaultValue="collector" disabled={nft.available === 0}>
                <option value="collector">Colecionador · {nft.available} disponíveis</option>
              </select>
            </label>
            <div>
              <span className="detail-label">Quantidade</span>
              <QuantityControl
                label="Quantidade"
                value={quantity}
                maximum={limit}
                disabled={add.isPending}
                onChange={setQuantity}
              />
            </div>
          </div>
          <p className="detail-limit">Limite de {nft.maxPerOrder} edições por pedido.</p>
          {nft.available === 0 && <p role="status">Edição esgotada.</p>}
          <div className="detail-actions">
            <Button
              disabled={
                add.isPending || !Number.isInteger(quantity) || quantity < 1 || quantity > limit
              }
              onClick={() => add.mutate()}
            >
              COMPRAR
            </Button>
            <Button
              variant="outline"
              aria-label="Favoritar NFT"
              aria-pressed={selected}
              disabled={favorite.isPending || (!!token && favorites.isPending)}
              onClick={() =>
                token
                  ? favorite.mutate({ nft, selected: !selected })
                  : void navigate({ to: '/login', search: { redirect: `/nft/${id}` } })
              }
            >
              <Heart size={17} fill={selected ? 'currentColor' : 'none'} />
            </Button>
            <Button variant="outline" aria-label="Copiar link do NFT" onClick={share}>
              <Share2 size={17} />
            </Button>
          </div>
          {shareStatus && <p role="status">{shareStatus}</p>}
          {favorite.error && <p role="alert">{favorite.error.message}</p>}
          {add.error && <p role="alert">{add.error.message}</p>}
          <QueryFeedback query={query} />
        </div>
      </div>
      <section className="detail-tabs-section">
        <div
          className="detail-tabs"
          role="tablist"
          aria-label="Informações do NFT"
          onKeyDown={(event) => {
            if (
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
            )
              return
            const buttons = [
              ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
            ]
            const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? buttons.length - 1
                  : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) %
                    buttons.length
            event.preventDefault()
            buttons[next]?.focus()
            buttons[next]?.click()
          }}
        >
          <button
            id="nft-details-tab"
            role="tab"
            tabIndex={tab === 'details' ? 0 : -1}
            aria-selected={tab === 'details'}
            aria-controls="nft-tab-panel"
            onClick={() => setTab('details')}
          >
            <Info size={15} aria-hidden="true" />
            Detalhes do NFT
          </button>
          <button
            id="nft-reviews-tab"
            role="tab"
            tabIndex={tab === 'reviews' ? 0 : -1}
            aria-selected={tab === 'reviews'}
            aria-controls="nft-tab-panel"
            onClick={() => setTab('reviews')}
          >
            <MessageSquare size={15} aria-hidden="true" />
            Avaliações de colecionadores
          </button>
        </div>
        <div
          id="nft-tab-panel"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={tab === 'details' ? 'nft-details-tab' : 'nft-reviews-tab'}
          className="detail-tab-panel"
        >
          {tab === 'details' ? (
            <>
              <p>{nft.description}</p>
              <p>
                Confira os atributos, a edição e a procedência desta obra antes de colecionar. Nesta
                demonstração, propriedade, carteiras e transações são simuladas.
              </p>
              <dl>
                {nft.attributes.map((attribute) => (
                  <div key={attribute.trait}>
                    <dt>{attribute.trait}:</dt>
                    <dd>{attribute.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Rede:</dt>
                  <dd>{nft.network}</dd>
                </div>
                <div>
                  <dt>Contrato:</dt>
                  <dd>{nft.contractAddress}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p>
              As avaliações não estão disponíveis nesta demonstração. Nenhuma avaliação foi
              publicada ou enviada.
            </p>
          )}
        </div>
      </section>
      <RelatedNfts title="Mais desta coleção" collection={nft.collection} excludeId={id} />
    </section>
  )
}
