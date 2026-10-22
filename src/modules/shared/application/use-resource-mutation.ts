import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMarketplace } from './use-marketplace'
import { keys } from './queries'
import { getSessionToken } from '@/lib/session-storage'
import type { MarketplaceRepositories, RequestContext } from '../domain/repositories'

export function useResourceMutation<TResult, TVariables>(
  operation: (
    api: MarketplaceRepositories,
    context: RequestContext,
    variables: TVariables
  ) => Promise<TResult>,
  resources: string[]
) {
  const { api, token, queries } = useMarketplace()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (variables: TVariables) => operation(api, { sessionToken: token }, variables),
    onSuccess: async () => {
      if (getSessionToken() !== token) return
      await Promise.all(
        resources.map((name) =>
          client.invalidateQueries({
            queryKey: name === 'session' ? keys.session(token) : keys.resource(queries.scope, name),
          })
        )
      )
    },
  })
}
