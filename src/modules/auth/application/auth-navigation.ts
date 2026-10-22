export function authSearch(search: Record<string, unknown>): { redirect?: string } {
  const path = search.redirect
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || [...path].some((character) => character.charCodeAt(0) < 32)) return {}
  const pathname = path.split(/[?#]/)[0]
  return ['/login', '/register'].includes(pathname) ? {} : { redirect: path }
}

export function authBackgroundPath(redirect?: string): string {
  if (!redirect) return '/'
  const pathname = redirect.split(/[?#]/)[0]
  if (pathname === '/' || pathname === '/cart' || pathname.startsWith('/nft/')) return redirect
  return pathname === '/checkout' ? '/cart' : '/'
}
