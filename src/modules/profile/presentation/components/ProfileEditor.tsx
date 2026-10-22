import { useRef } from 'react'
import { ImagePlus } from 'lucide-react'
import type { Profile } from '../../domain/profile.contracts'
import { readEnsName } from '../../application/ens-name'
import { useProfileEditor } from '../../application/use-profile-editor'
import { useAvatarUpload } from '../../application/use-avatar-upload'
import { FormError } from '@/components/ui/FormError'
import { fieldErrorProps } from '@/components/ui/form-error-props'
import { Button } from '@/components/ui/button'
import { EnsField } from './EnsField'
import { AccountPasswordField } from './AccountPasswordField'

export function ProfileEditor({ profile }: { profile: Profile }) {
  const editor = useProfileEditor()
  const avatar = useAvatarUpload()
  const uploadInput = useRef<HTMLInputElement>(null)
  const avatarUrlInput = useRef<HTMLInputElement>(null)
  return (
    <form
      className="collector-profile-form"
      aria-label="Perfil do colecionador"
      onSubmit={async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const data = new FormData(form)
        const saved = await editor.save(
          {
            name: String(data.get('name')),
            handle: String(data.get('handle')),
            email: String(data.get('email')),
            walletLabel: String(data.get('walletLabel')),
            ensName: readEnsName(data),
          },
          {
            current: String(data.get('currentPassword')),
            next: String(data.get('newPassword')),
            confirmation: String(data.get('confirmation')),
          }
        )
        if (saved)
          for (const name of ['currentPassword', 'newPassword', 'confirmation']) {
            const input = form.elements.namedItem(name)
            if (input instanceof HTMLInputElement) input.value = ''
          }
      }}
    >
      <fieldset className="profile-form-fields" disabled={editor.saving || avatar.pending}>
        <div className="account-fields">
          <label className="account-field">
            Nome de exibição
            <span className="required-mark" aria-hidden="true" />
            <input
              name="name"
              defaultValue={profile.name}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              {...fieldErrorProps(editor.update.error, 'name', 'profile-error')}
            />
          </label>
          <label className="account-field">
            Nome de usuário
            <span className="required-mark" aria-hidden="true" />
            <input
              name="handle"
              defaultValue={profile.handle}
              required
              minLength={2}
              maxLength={40}
              autoComplete="username"
              {...fieldErrorProps(editor.update.error, 'handle', 'profile-error')}
            />
          </label>
          <label className="account-field">
            E-mail
            <span className="required-mark" aria-hidden="true" />
            <input
              name="email"
              defaultValue={profile.email}
              type="email"
              required
              autoComplete="email"
              {...fieldErrorProps(editor.update.error, 'email', 'profile-error')}
            />
          </label>
          <EnsField
            value={profile.ensName}
            error={editor.update.error}
            errorPrefix="profile-error"
          />
          <label className="account-field">
            Apelido da carteira
            <input
              name="walletLabel"
              defaultValue={profile.walletLabel ?? ''}
              maxLength={80}
              {...fieldErrorProps(editor.update.error, 'walletLabel', 'profile-error')}
            />
          </label>
          <div className="account-field">
            Avatar
            <div className="profile-avatar-actions">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar do colecionador" width={44} height={44} />
              ) : (
                <span className="avatar-placeholder" role="img" aria-label="Sem avatar">
                  <ImagePlus size={20} aria-hidden="true" />
                </span>
              )}
              <input
                ref={uploadInput}
                className="sr-only"
                aria-label="Enviar avatar"
                tabIndex={-1}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={avatar.pending}
                onChange={(event) => {
                  avatar.upload(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={avatar.pending}
                aria-label="Alterar avatar"
                aria-describedby="avatar-upload-help"
                onClick={() => uploadInput.current?.click()}
              >
                Alterar
              </Button>
              <button
                className="avatar-remove"
                type="button"
                disabled={avatar.pending || !profile.avatarUrl}
                aria-label="Remover avatar"
                onClick={avatar.remove}
              >
                Remover
              </button>
              <span id="avatar-upload-help" className="sr-only">
                Escolha uma imagem PNG, JPEG ou WebP de até 1 MB.
              </span>
            </div>
          </div>
          <div className="account-field">
            <label>
              URL do avatar
              <input
                ref={avatarUrlInput}
                key={profile.avatarUrl}
                type="url"
                maxLength={2048}
                placeholder="https://exemplo.com/avatar.png"
                defaultValue={/^https?:\/\//i.test(profile.avatarUrl) ? profile.avatarUrl : ''}
                {...fieldErrorProps(avatar.error, 'avatarUrl', 'avatar-error')}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={avatar.pending}
              onClick={() => {
                if (avatarUrlInput.current?.reportValidity())
                  avatar.setUrl(avatarUrlInput.current.value)
              }}
            >
              Usar URL do avatar
            </Button>
          </div>
        </div>
        {avatar.fileError && (
          <p role="alert" className="account-error">
            {avatar.fileError}
          </p>
        )}
        <FormError error={avatar.error} id="avatar-error" />
        <section className="profile-password-section" aria-labelledby="password-title">
          <h2 id="password-title">Alterar senha</h2>
          <AccountPasswordField
            label="Senha atual"
            name="currentPassword"
            error={editor.password.error}
            onChange={editor.clearConfirmationError}
          />
          <AccountPasswordField
            label="Nova senha"
            name="newPassword"
            error={editor.password.error}
            onChange={editor.clearConfirmationError}
          />
          <AccountPasswordField
            label="Confirmar nova senha"
            name="confirmation"
            error={null}
            confirmationError={editor.confirmationError}
            onChange={editor.clearConfirmationError}
          />
        </section>
        <FormError error={editor.update.error} id="profile-error" />
        <FormError error={editor.password.error} id="password-error" />
        {editor.confirmationError && (
          <p id="password-confirmation-error" role="alert" className="account-error">
            {editor.confirmationError}
          </p>
        )}
        <Button className="account-save" type="submit" disabled={editor.saving || avatar.pending}>
          {editor.saving ? 'Salvando…' : 'Salvar'}
        </Button>
        {editor.success && (
          <p role="status" className="account-success">
            {editor.success}
          </p>
        )}
      </fieldset>
    </form>
  )
}
