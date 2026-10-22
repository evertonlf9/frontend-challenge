import { useState } from 'react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useAuthentication } from '@/modules/shared/application/use-marketplace'

interface AuthFields {
  name: string
  email: string
  password: string
  confirmation: string
}

export function useAuthForm(mode: 'login' | 'register') {
  const mutation = useAuthentication(mode)
  const router = useRouter()
  const search = useSearch({ strict: false })
  const [confirmationError, setConfirmationError] = useState<string | null>(null)

  function submit(input: AuthFields) {
    if (mutation.isPending) return
    if (mode === 'register' && input.password !== input.confirmation) {
      setConfirmationError('As senhas devem ser iguais.')
      return
    }
    setConfirmationError(null)
    mutation.mutate(
      { name: input.name.trim(), email: input.email.trim(), password: input.password },
      {
        onSuccess: async () => {
          await router.invalidate()
          await router.navigate({ href: search.redirect ?? '/profile' })
        },
      }
    )
  }

  return {
    submit,
    pending: mutation.isPending,
    error: mutation.error,
    confirmationError,
    clearConfirmationError: () => setConfirmationError(null),
  }
}
