import { createRoot, hydrateRoot } from 'react-dom/client'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'
import { subscribeSession } from '@/lib/session-storage'
import { Application } from './Application'

export async function mountApplication() {
  subscribeSession(() => {
    void queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === 'private' || query.queryKey[0] === 'session' })
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'private' || query.queryKey[0] === 'session' })
    queryClient.getMutationCache().clear()
    void router.invalidate()
  })

  const root = document.getElementById('root')!
  const publicRoute = (location.pathname === '/' && !location.search && !location.hash) || location.pathname.startsWith('/nft/')
  const prerendered = !!root.dataset.prerendered && publicRoute
  // Router's SSR mode preserves the same Suspense boundary structure used by
  // its server renderer. Only pending public shells are hydrated; no data cache
  // is serialized, and Query performs the initial REST requests in the browser.
  if (prerendered) router.ssr = { manifest: undefined }
  await router.load()
  if (prerendered) hydrateRoot(root, <Application />)
  else createRoot(root).render(<Application />)
  delete root.dataset.prerendered
}

