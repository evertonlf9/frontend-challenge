import { defaultParseSearch } from '@tanstack/react-router'

/** Preserva os decimais digitados na URL antes que o parser JSON tente convertê-los em números. */
export function parseMarketplaceSearch(search: string): Record<string, unknown> {
  const parsed: Record<string, unknown> = { ...defaultParseSearch(search) }
  const params = new URLSearchParams(search)
  for (const field of ['minPrice', 'maxPrice']) {
    const raw = params.get(field)
    if (raw && /^\d+(\.\d{1,18})?$/.test(raw)) parsed[field] = raw
  }
  return parsed
}
