import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

export function useRouteFocus() {
  const location = useRouterState({ select: (state) => state.location })
  const status = useRouterState({ select: (state) => state.status })
  const previous = useRef({ pathname: location.pathname, hash: location.hash })
  useEffect(() => {
    if (status !== 'idle') return
    const old = previous.current
    previous.current = { pathname: location.pathname, hash: location.hash }
    const changedPage = old.pathname !== location.pathname
    const changedSection = !!location.hash && old.hash !== location.hash
    let observer: MutationObserver | undefined
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById('conteudo')
      const updateTitle = () => {
        const heading = document.querySelector<HTMLElement>('dialog[open] h1, main h1')
        const title = location.pathname === '/login' ? 'Entrar' : location.pathname === '/register' ? 'Criar conta' : heading?.textContent?.trim()
        document.title = title ? `${title} — Kurio` : 'Kurio — Marketplace de NFTs'
        return heading
      }
      updateTitle()
      if (document.querySelector('dialog[open]')) return
      const wasDialog = ['/login', '/register'].includes(old.pathname) || old.pathname.startsWith('/orders/')
      if (wasDialog && document.activeElement !== document.body && document.activeElement?.isConnected) return
      const section = changedSection ? document.getElementById(location.hash) : null
      const target = section?.querySelector<HTMLElement>('h1,h2,h3') ?? section ?? main?.querySelector<HTMLElement>('h1') ?? main
      if (!target) return
      const focus = (element: HTMLElement) => {
        if (!element.hasAttribute('tabindex')) element.tabIndex = -1
        element.focus({ preventScroll: true })
      }
      if (changedPage || changedSection) focus(target)
      // Data-driven headings may arrive after the route shell. Do not steal focus
      // if the user has already moved from that shell to another control.
      if (main && !main.querySelector('h1')) {
        observer = new MutationObserver(() => {
          const heading = updateTitle()
          if (!heading) return
          if (changedPage && document.activeElement === main && !document.querySelector('dialog[open]')) focus(heading)
          observer?.disconnect()
        })
        observer.observe(main, { childList: true, subtree: true })
      }
    })
    return () => { cancelAnimationFrame(frame); observer?.disconnect() }
  }, [location.pathname, location.hash, status])
}
