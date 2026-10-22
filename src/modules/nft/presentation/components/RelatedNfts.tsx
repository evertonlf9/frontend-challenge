import { useQuery } from '@tanstack/react-query'
import { useMarketplace } from '@/modules/shared/application/use-marketplace'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { NftCard } from './NftCard'
export function RelatedNfts({ title = 'Colecionadores também viram', collection, excludeId }: { title?: string; collection?: string; excludeId?: string }) {
  const { queries } = useMarketplace()
  const query = useQuery(queries.nfts({ pageSize: 6, collection }))
  return <section className="related-section"><h2>{title}</h2><QueryFeedback query={query} /><div className="related-grid">{query.data?.items.filter((nft) => nft.id !== excludeId).slice(0, 5).map((nft) => <NftCard key={nft.id} {...nft} price={nft.priceEth} oldPrice={nft.previousPriceEth ?? undefined} />)}</div></section>
}
