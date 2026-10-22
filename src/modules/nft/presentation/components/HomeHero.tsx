import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { artworkImage } from '../artwork-image'
import { describeArtwork } from '../artwork-description'

const highlights = ['emerald', 'sage', 'neon'] as const

export function HomeHero({ onExplore }: { onExplore: () => void }) {
  const [highlight, setHighlight] = useState(0)
  return (
    <section className="hero" aria-label="Destaques da Kurio">
      <div className="hero-copy">
        <span className="hero-eyebrow">Bem-vindo à Kurio</span>
        <h1>
          SEJA DONO DO FUTURO
          <br />
          DA ARTE DIGITAL
        </h1>
        <p>
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <Button className="hero-cta" onClick={onExplore}>
          EXPLORAR
        </Button>
      </div>
      <img
        className="hero-art"
        src={`/artwork/${highlights[highlight]}.webp`}
        {...artworkImage(
          `/artwork/${highlights[highlight]}.webp`,
          '(max-width: 767px) calc(100vw - 40px), 405px'
        )}
        alt={describeArtwork(`/artwork/${highlights[highlight]}.webp`, 'Arte em destaque na Kurio')}
        width={405}
        height={405}
        fetchPriority="high"
      />
      <div className="hero-dots" role="group" aria-label="Selecionar destaque">
        {highlights.map((name, index) => (
          <button
            key={name}
            aria-label={`Destaque ${index + 1}`}
            aria-pressed={highlight === index}
            onClick={() => setHighlight(index)}
          />
        ))}
      </div>
    </section>
  )
}
