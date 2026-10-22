import { Button } from './button'

interface QueryFeedbackProps {
  query: { isPending: boolean; isFetching: boolean; error: Error | null; refetch: () => unknown }
  empty?: boolean
  variant?: 'catalog' | 'detail' | 'summary'
}
export function QueryFeedback({ query, empty, variant = 'summary' }: QueryFeedbackProps) {
  if (query.isPending) return <div role="status" aria-label="Carregando" className="py-6"><span className="sr-only">Carregando…</span><div aria-hidden="true" className={variant === 'catalog' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : variant === 'detail' ? 'grid lg:grid-cols-2 gap-12' : 'grid gap-4'}>{Array.from({ length: variant === 'catalog' ? 9 : variant === 'detail' ? 2 : 1 }, (_, index) => <div key={index} className={`skeleton rounded-xl ${variant === 'summary' ? 'h-44' : 'aspect-square'}`} />)}</div></div>
  if (query.error) return <div role="alert" className="space-y-3 py-6"><p>{query.error.message}</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>
  if (empty) return <p role="status" className="py-6">Nenhum resultado encontrado.</p>
  if (query.isFetching) return <p role="status" className="text-sm py-2">Atualizando em segundo plano…</p>
  return null
}
