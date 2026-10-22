import { useId } from 'react'
import { BookOpen } from 'lucide-react'
import { useAccessibility } from '../../application/accessibility-context'

export function ReadingModeToggle() {
  const { readingMode, toggleReadingMode } = useAccessibility()
  const description = useId()
  return (
    <span className="reading-mode-control" data-reading-ignore>
      <button
        type="button"
        aria-pressed={readingMode}
        aria-describedby={description}
        onClick={toggleReadingMode}
      >
        <BookOpen size={16} aria-hidden="true" />
        Leitura por Tab<span className="sr-only">{readingMode ? ' ativada' : ' desativada'}</span>
      </button>
      <span className="sr-only" id={description}>
        Ative para incluir títulos, textos, valores e imagens na navegação com Tab e Shift+Tab. Com
        um leitor de tela, também é possível ler o conteúdo com as setas.
      </span>
    </span>
  )
}
