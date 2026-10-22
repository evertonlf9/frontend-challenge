import { useState, useRef, useEffect } from 'react'
import { useResourceMutation } from '@/modules/shared/application/use-resource-mutation'
import type { UpdateProfileInput } from '../domain/profile.contracts'

export function useAvatarUpload() {
  const update = useResourceMutation((api, context, input: UpdateProfileInput) => api.profile.update(input, context), ['profile'])
  const [fileError, setFileError] = useState('')
  const reader = useRef<FileReader | null>(null)
  useEffect(() => () => { reader.current?.abort() }, [])
  function upload(file?: File) {
    if (!file) return
    reader.current?.abort()
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1_000_000) {
      setFileError('Escolha uma imagem PNG, JPEG ou WebP de até 1 MB.')
      return
    }
    setFileError('')
    const next = new FileReader()
    reader.current = next
    next.onload = () => update.mutate({ avatarUrl: String(next.result) })
    next.onerror = () => setFileError('Não foi possível ler a imagem.')
    next.readAsDataURL(file)
  }
  function setUrl(value: string) {
    try {
      const url = new URL(value.trim())
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid URL')
      setFileError('')
      reader.current?.abort()
      update.mutate({ avatarUrl: url.href })
    } catch { setFileError('Informe uma URL HTTP ou HTTPS válida, sem credenciais.') }
  }
  return { upload, setUrl, remove: () => { reader.current?.abort(); setFileError(''); update.mutate({ avatarUrl: '' }) }, pending: update.isPending, error: update.error, fileError }
}
