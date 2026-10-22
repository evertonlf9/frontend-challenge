const preferenceKey = 'kurio.accessibility.reading-mode'
let fallback = false
const listeners = new Set<() => void>()

export function readReadingPreference(): boolean {
  try {
    return localStorage.getItem(preferenceKey) === 'true'
  } catch {
    return fallback
  }
}

export function subscribeReadingPreference(listener: () => void) {
  listeners.add(listener)
  const storageChanged = (event: StorageEvent) => {
    if (event.key === preferenceKey || event.key === null) listener()
  }
  window.addEventListener('storage', storageChanged)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', storageChanged)
  }
}

export function toggleReadingPreference() {
  fallback = !readReadingPreference()
  try {
    localStorage.setItem(preferenceKey, String(fallback))
  } catch {
    /* In-memory preference remains usable. */
  }
  listeners.forEach((listener) => listener())
}
