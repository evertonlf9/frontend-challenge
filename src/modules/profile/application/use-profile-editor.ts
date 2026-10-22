import { useState } from 'react'
import { useResourceMutation } from '@/modules/shared/application/use-resource-mutation'
import type { ChangePasswordInput, UpdateProfileInput } from '../domain/profile.contracts'

export function useProfileEditor() {
  const update = useResourceMutation(
    (api, context, input: UpdateProfileInput) => api.profile.update(input, context),
    ['profile', 'session']
  )
  const password = useResourceMutation(
    (api, context, input: ChangePasswordInput) => api.profile.changePassword(input, context),
    []
  )
  const [confirmationError, setConfirmationError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(
    input: UpdateProfileInput,
    credentials: { current: string; next: string; confirmation: string }
  ): Promise<boolean> {
    if (saving) return false
    setSuccess('')
    const changingPassword = !!(credentials.current || credentials.next || credentials.confirmation)
    if (
      changingPassword &&
      (!credentials.current ||
        credentials.next.length < 8 ||
        credentials.next !== credentials.confirmation)
    ) {
      setConfirmationError(
        'Preencha a senha atual e confirme a nova senha com pelo menos oito caracteres.'
      )
      return false
    }
    setConfirmationError(null)
    setSaving(true)
    try {
      await update.mutateAsync(input)
      setSuccess('Perfil atualizado.')
      if (changingPassword) {
        await password.mutateAsync({
          currentPassword: credentials.current,
          newPassword: credentials.next,
        })
        setSuccess('Perfil atualizado. Senha atualizada.')
      }
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }
  return {
    save,
    saving,
    update,
    password,
    confirmationError,
    clearConfirmationError: () => setConfirmationError(null),
    success,
  }
}
