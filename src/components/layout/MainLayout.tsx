import { AccessibilityMenu } from '@/modules/accessibility/presentation/components/AccessibilityMenu'
import { useRouteFocus } from '@/modules/accessibility/application/use-route-focus'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { useRealtime } from '@/modules/shared/application/use-realtime'

export function MainLayout() {
  useRouteFocus()
  const { message } = useRealtime()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <div className="app-shell" data-page={pathname.startsWith('/nft/') ? '/nft' : pathname}>
    <a href="#conteudo" className="skip-link" onClick={() => document.getElementById('conteudo')?.focus()}>Pular para conteúdo</a>
    <AccessibilityMenu />
    <Header />
    <div role="status" aria-live="polite" className={message ? 'realtime-notice' : 'sr-only'}>{message}</div>
    <main id="conteudo" tabIndex={-1} className="site-container site-main"><Outlet /></main>
    <Footer />
  </div>
}
