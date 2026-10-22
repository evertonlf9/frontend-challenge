import { createMemoryHistory, defaultStringifySearch } from '@tanstack/react-router'
import { renderToString } from 'react-dom/server'
import { Application } from './Application'
import { router } from './router'
import { queryClient } from './lib/query-client'
import { catalogSearch } from './modules/nft/application/catalog-search'

/** Build-time public shell only. Queries remain pending and no private state or
 * catalog payload is serialized. The browser hydrates and fetches through MSW. */
export async function renderPublicRoute(path: string) {
  queryClient.clear()
  const entry = path === '/' ? '/' + defaultStringifySearch(catalogSearch({})) : path
  router.update({ history: createMemoryHistory({ initialEntries: [entry] }) })
  try {
    await router.load()
    return renderToString(<Application />)
  } finally {
    // Release Query's GC timers so the build process can terminate immediately.
    queryClient.clear()
  }
}
