import { useRef } from 'react'
import { Accessibility, X } from 'lucide-react'
import { useAccessibility } from '../../application/accessibility-context'
import { ReadingModeToggle } from './ReadingModeToggle'

export function AccessibilityMenu() {
  const ref = useRef<HTMLDetailsElement>(null)
  const { readingMode } = useAccessibility()
  // This panel sits outside the document reading roots and manages its own targets.
  const readingProps = {
    tabIndex: readingMode ? 0 : undefined,
    'data-reading-focus': readingMode ? '' : undefined,
  }
  const close = () => {
    if (ref.current) {
      ref.current.open = false
      ref.current.querySelector('summary')?.focus()
    }
  }
  return (
    <details
      ref={ref}
      className="accessibility-menu"
      data-reading-ignore
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          close()
        }
      }}
    >
      <summary aria-label="Acessibilidade">
        <Accessibility size={20} aria-hidden="true" />
        <span>Acessibilidade</span>
      </summary>
      <div className="accessibility-panel">
        <div>
          <h2 {...readingProps}>Acessibilidade</h2>
          <button type="button" aria-label="Fechar acessibilidade" onClick={close}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <ReadingModeToggle />
        <p {...readingProps}>
          Com a leitura ativada, use Tab e Shift+Tab para percorrer também os conteúdos. A
          preferência permanece ao recarregar a página.
        </p>
        <p {...readingProps}>
          Sem esse modo, Tab percorre os controles. Leitores de tela podem usar setas e atalhos para
          títulos e imagens.
        </p>
      </div>
    </details>
  )
}
