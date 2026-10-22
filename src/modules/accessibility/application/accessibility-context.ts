import { createContext, useContext } from 'react'

interface AccessibilityPreferences {
  readingMode: boolean
  toggleReadingMode: () => void
}
export const AccessibilityContext = createContext<AccessibilityPreferences | null>(null)
export function useAccessibility() {
  const value = useContext(AccessibilityContext)
  if (!value) throw new Error('AccessibilityProvider ausente.')
  return value
}
