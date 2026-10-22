import { useSyncExternalStore, type ReactNode } from 'react'
import { readReadingPreference, subscribeReadingPreference, toggleReadingPreference } from '../../application/reading-preference'
import { AccessibilityContext } from '../../application/accessibility-context'
import { useReadingNavigation } from '../../application/use-reading-navigation'

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const readingMode = useSyncExternalStore(subscribeReadingPreference, readReadingPreference, () => false)
  useReadingNavigation(readingMode)
  return <AccessibilityContext.Provider value={{ readingMode, toggleReadingMode: toggleReadingPreference }}>{children}</AccessibilityContext.Provider>
}
