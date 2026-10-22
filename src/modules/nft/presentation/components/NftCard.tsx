import { describeArtwork } from '../artwork-description'
import { artworkImage } from '../artwork-image'
import { Link } from '@tanstack/react-router'

interface NftCardProps { id: string; name: string; price: string; oldPrice?: string; imageUrl: string; creatorAvatar?: string }
export function NftCard({ id, name, price, oldPrice, imageUrl }: NftCardProps) {
  return <Link to="/nft/$id" params={{ id }} className="nft-card">
    <div className="nft-card-art"><img src={imageUrl} {...artworkImage(imageUrl, '(max-width: 767px) 45vw, 240px')} alt={describeArtwork(imageUrl)} width={400} height={400} loading="lazy" decoding="async" /></div>
    <h3>{name}</h3><p className="nft-price">{price} ETH {oldPrice && <span className="nft-old-price">{oldPrice} ETH</span>}</p>
  </Link>
}
