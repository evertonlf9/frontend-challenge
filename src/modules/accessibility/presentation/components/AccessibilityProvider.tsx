import type { ReactNode } from 'react'
import { useReadingNavigation } from '../../application/use-reading-navigation'

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  useReadingNavigation()
  return children
}
