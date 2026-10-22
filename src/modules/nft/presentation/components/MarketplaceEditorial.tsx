import { describeArtwork } from '../artwork-description'
import { artworkImage } from '../artwork-image'
import { useState } from 'react'
import { X } from 'lucide-react'
import { ReviewDialog } from '@/components/ui/ReviewDialog'
import { Button } from '@/components/ui/button'

const articles = [
  { title: 'Como funciona a propriedade de NFTs', image: 'neon', day: 12, minutes: 6, description: 'Aprenda a colecionar, negociar e verificar ativos digitais.', content: 'NFTs são registros digitais únicos que podem identificar a procedência de uma obra. Antes de colecionar, verifique o criador, a coleção e as condições de uso. Nesta demonstração, as compras e transações são simuladas.' },
  { title: '10 artistas digitais para acompanhar', image: 'emerald', day: 13, minutes: 2, description: 'Conheça criadores, trabalhos e coleções que você pode descobrir.', content: 'Explore as coleções do catálogo e conheça os perfis dos criadores em cada detalhe de NFT. Compare estilos, atributos e edições disponíveis para encontrar obras de seu interesse.' },
  { title: 'Raridade, atributos e procedência', image: 'sage', day: 15, minutes: 3, description: 'Entenda raridade, edições, direitos autorais e utilidade.', content: 'Os atributos e a edição ajudam a descrever uma obra. O número de unidades disponíveis e o limite por pedido aparecem no detalhe. Uma edição esgotada não pode ser comprada.' },
  { title: 'Como proteger sua carteira', image: 'golden', day: 15, minutes: 2, description: 'Proteja sua carteira, seus ativos digitais e sua identidade.', content: 'Confira sempre a rede e o endereço da carteira antes de revisar um pedido. Nunca compartilhe chaves privadas ou frases de recuperação. A Kurio não solicita esses dados e utiliza apenas carteiras fictícias nesta demonstração.' },
]
export function MarketplaceEditorial() {
  const [active, setActive] = useState<number | null>(null)
  const article = active === null ? null : articles[active]
  return <section className="editorial" id="aprenda">
    <h2>Diário da Cunhagem</h2><p>Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
    <div className="editorial-grid">{articles.map((item, index) => <article className="editorial-card" key={item.title}>
      <img src={`/artwork/${item.image}.webp`} {...artworkImage(`/artwork/${item.image}.webp`, '(max-width: 767px) 45vw, 250px')} alt={describeArtwork(`/artwork/${item.image}.webp`, `Capa de ${item.title}`)} width={250} height={176} loading="lazy" />
      <div className="editorial-copy"><div className="editorial-date">{item.day} de setembro&nbsp; | &nbsp;Leitura de {item.minutes} min</div><h3>{item.title}</h3><p>{item.description}</p><button onClick={() => setActive(index)}>Ler mais →<span className="sr-only"> {item.title}</span></button></div>
    </article>)}</div>
    <ReviewDialog open={!!article} onClose={() => setActive(null)} labelledBy="article-title" className="content-dialog article-dialog">{article && <div><button type="button" className="content-dialog-close" aria-label="Fechar artigo" onClick={() => setActive(null)}><X size={20} aria-hidden="true" /></button><h2 id="article-title" className="article-dialog-title">{article.title}</h2><p>{article.content}</p><Button onClick={() => setActive(null)}>Fechar leitura</Button></div>}</ReviewDialog>
  </section>
}
