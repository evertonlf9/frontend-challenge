import { isApiError } from '@/lib/api-error'
export function FormError({ error, id }: { error: unknown; id: string }) {
  if (!(error instanceof Error)) return null
  return <div role="alert" id={id}><p>{error.message}</p>{isApiError(error) && error.details.map((issue) => <p key={issue.field} id={id + '-' + issue.field}>{issue.message}</p>)}</div>
}
