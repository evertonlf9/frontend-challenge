import { artworkImage } from './artwork-image'

export const DETAIL_IMAGE_SIZES = '(max-width: 767px) calc(100vw - 78px), 430px'

/** Called with validated REST data; never infer an NFT image from its ID. */
export function preloadArtwork(url: string, sizes: string) {
  const link = document.querySelector<HTMLLinkElement>('link[data-nft-image]') ?? document.createElement('link')
  const image = artworkImage(url, sizes)
  link.dataset.nftImage = ''
  link.rel = 'preload'
  link.as = 'image'
  link.fetchPriority = 'high'
  link.href = url
  link.imageSrcset = image.srcSet ?? ''
  link.imageSizes = image.sizes ?? ''
  if (!link.isConnected) document.head.append(link)
}
