import { useEffect } from 'react'

const textGroupSelector =
  'h1,h2,h3,h4,h5,h6,p,dt,dd,blockquote,figcaption,caption,th,td,legend,address,[data-reading-target]'
const readingSelector = `${textGroupSelector},div,span,small,strong,b,em,i,li,time,img[alt],[role="img"]`
const excludedSelector =
  'a,button,label,summary,input,select,textarea,script,style,template,noscript,[contenteditable="true"],[aria-hidden="true"],[hidden],[inert],.sr-only,[data-reading-ignore]'

function hasOwnText(element: HTMLElement): boolean {
  return [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim()
  )
}

function canRead(element: HTMLElement): boolean {
  if (element.closest(excludedSelector)) return false
  if (element.closest('details:not([open])')) return false
  const image = element instanceof HTMLImageElement || element.getAttribute('role') === 'img'
  if (image) {
    const description =
      element instanceof HTMLImageElement ? element.alt : element.getAttribute('aria-label')
    if (!description?.trim()) return false
  } else {
    if (element.parentElement?.closest(textGroupSelector)) return false
    if (!element.textContent?.trim()) return false
    if (!element.matches(textGroupSelector) && !hasOwnText(element)) return false
  }
  const bounds = element.getBoundingClientRect()
  return bounds.width > 1 && bounds.height > 1 && getComputedStyle(element).visibility !== 'hidden'
}

export function useReadingNavigation() {
  useEffect(() => {
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
      const root = dialog ?? document.body
      const targets = new Set(
        [...root.querySelectorAll<HTMLElement>(readingSelector)].filter(canRead)
      )
      for (const [element, previous] of managed) {
        if (!targets.has(element)) {
          restore(element, previous)
          managed.delete(element)
        }
      }
      for (const element of targets) {
        if (managed.has(element) || element.tabIndex >= 0) continue
        managed.set(element, element.getAttribute('tabindex'))
        element.tabIndex = 0
        element.setAttribute('data-reading-focus', '')
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(scan)
    }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['open', 'hidden', 'class', 'style', 'aria-hidden', 'inert', 'alt'],
    })
    window.addEventListener('resize', schedule)
    scan()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
      for (const [element, previous] of managed) restore(element, previous)
    }
  }, [])
}
