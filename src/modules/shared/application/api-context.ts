import { createContext, useContext } from 'react'
import type { MarketplaceRepositories } from '../domain/repositories'

export const ApiContext = createContext<MarketplaceRepositories | null>(null)
export function useRepositories(): MarketplaceRepositories {
  const value = useContext(ApiContext)
  if (!value) throw new Error('ApiContext não configurado.')
  return value
}
