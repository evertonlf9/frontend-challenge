import './index.css'
import { setNetworkReady } from './network-ready'

async function bootstrap() {
  // Let server-rendered public content paint before evaluating the application
  // and mock stacks. This also applies to normal preview and hosted builds.
  if (document.getElementById('root')?.dataset.prerendered) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))))
  }
  // Render the shell while mocks load. HTTP and Socket.IO await network readiness.
  const application = import('./bootstrap')
  let networkFailed = false
  const mounted = application.then(({ mountApplication }) => { if (!networkFailed) return mountApplication() })
  const startingMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true'
    ? import('./mocks/browser').then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
    : Promise.resolve()
  const mocks = startingMocks.catch((error: unknown) => { networkFailed = true; throw error })
  setNetworkReady(mocks)
  await Promise.all([
    mocks,
    mounted,
  ])
}

void bootstrap().catch(() => {
  document.getElementById('root')!.textContent = 'Não foi possível iniciar a aplicação. Recarregue a página.'
})
