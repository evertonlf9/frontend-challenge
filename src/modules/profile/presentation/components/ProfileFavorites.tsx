import { useQuery } from '@tanstack/react-query'
import { useMarketplace } from '@/modules/shared/application/use-marketplace'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { NftCard } from '@/modules/nft/presentation/components/NftCard'

export function ProfileFavorites() {
  const { queries } = useMarketplace()
  const favorites = useQuery(queries.favorites())
  return <section id="favoritos" aria-labelledby="favorites-title" className="profile-favorites">
    <h2 id="favorites-title">Lista de interesse</h2>
    <QueryFeedback query={favorites} empty={favorites.data?.items.length === 0} />
    <div className="nft-grid">{favorites.data?.items.map((nft) => <NftCard key={nft.id} {...nft} price={nft.priceEth} oldPrice={nft.previousPriceEth ?? undefined} />)}</div>
  </section>
}
