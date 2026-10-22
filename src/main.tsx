import './index.css'
import { setNetworkReady } from './network-ready'

async function bootstrap() {
  // Deixa o HTML pré-renderizado aparecer antes de carregar a aplicação e os mocks.
  if (document.getElementById('root')?.dataset.prerendered) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)))
    )
  }
  // O shell pode montar em paralelo: HTTP e Socket.IO aguardam os mocks.
  const application = import('./bootstrap')
  let networkFailed = false
  const mounted = application.then(({ mountApplication }) => {
    if (!networkFailed) return mountApplication()
  })
  const startingMocks =
    import.meta.env.VITE_ENABLE_MOCKS === 'true'
      ? import('./mocks/browser').then(({ worker }) =>
          worker.start({ onUnhandledRequest: 'bypass' })
        )
      : Promise.resolve()
  const mocks = startingMocks.catch((error: unknown) => {
    networkFailed = true
    throw error
  })
  setNetworkReady(mocks)
  await Promise.all([mocks, mounted])
}

void bootstrap().catch(() => {
  document.getElementById('root')!.textContent =
    'Não foi possível iniciar a aplicação. Recarregue a página.'
})
