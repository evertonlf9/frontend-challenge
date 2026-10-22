import { ChevronRight } from 'lucide-react'
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
}
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages < 2) return null
  return (
    <nav className="pagination" aria-label="Paginação do catálogo">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          aria-label={`Página ${page}`}
          aria-current={currentPage === page ? 'page' : undefined}
          onClick={() => onPageChange?.(page)}
        >
          {page}
        </button>
      ))}
      <button
        aria-label="Próxima página"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  )
}
