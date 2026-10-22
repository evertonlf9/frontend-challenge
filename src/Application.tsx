import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { AccessibilityProvider } from '@/modules/accessibility/presentation/components/AccessibilityProvider'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'
import { ApiContext } from '@/modules/shared/application/api-context'
import { repositories } from '@/infrastructure/api/repositories'

export function Application() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ApiContext.Provider value={repositories}>
          <AccessibilityProvider>
            <RouterProvider router={router} />
          </AccessibilityProvider>
        </ApiContext.Provider>
      </QueryClientProvider>
    </StrictMode>
  )
}
