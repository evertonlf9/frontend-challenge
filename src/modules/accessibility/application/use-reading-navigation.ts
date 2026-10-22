import { useEffect } from 'react'

const readingSelector = 'h1,h2,h3,h4,p,dt,dd,blockquote,figcaption,th,td,img[alt],[data-reading-target]'
const excludedSelector = 'a,button,label,summary,input,select,textarea,[contenteditable="true"],[aria-hidden="true"],[hidden],.sr-only,[data-reading-ignore]'

function canRead(element: HTMLElement): boolean {
  if (element.closest(excludedSelector)) return false
  if (element.closest('details:not([open])')) return false
  if (element.matches('td,th') && element.querySelector('a,button,input,select,textarea')) return false
  if (element.parentElement?.closest('p,blockquote,figcaption,td,th,[data-reading-target]')) return false
  if (!(element instanceof HTMLImageElement ? element.alt.trim() : element.textContent?.trim())) return false
  const bounds = element.getBoundingClientRect()
  return bounds.width > 1 && bounds.height > 1 && getComputedStyle(element).visibility !== 'hidden'
}

export function useReadingNavigation(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const managed = new Map<HTMLElement, string | null>()
    let frame = 0
    const restore = (element: HTMLElement, previous: string | null) => {
      if (previous === null) element.removeAttribute('tabindex')
      else element.setAttribute('tabindex', previous)
      element.removeAttribute('data-reading-focus')
    }
    const scan = () => {
      frame = 0
      const dialog = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1)
      const roots = dialog ? [dialog] : [...document.querySelectorAll<HTMLElement>('main,footer')]
      const targets = new Set(roots.flatMap((root) => [...root.querySelectorAll<HTMLElement>(readingSelector)]).filter(canRead))
      for (const [element, previous] of managed) {
        if (!targets.has(element)) { restore(element, previous); managed.delete(element) }
      }
      for (const element of targets) {
        if (managed.has(element) || element.tabIndex >= 0) continue
        managed.set(element, element.getAttribute('tabindex'))
        element.tabIndex = 0
        element.setAttribute('data-reading-focus', '')
      }
      if (dialog && document.activeElement === document.body) [...targets][0]?.focus({ preventScroll: true })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(scan) }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['open', 'hidden', 'class', 'style', 'aria-hidden'] })
    window.addEventListener('resize', schedule)
    scan()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
      for (const [element, previous] of managed) restore(element, previous)
    }
  }, [enabled])
}
