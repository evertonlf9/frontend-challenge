import { useState } from 'react'
import { FormError } from '@/components/ui/FormError'
import { fieldErrorProps } from '@/components/ui/form-error-props'
import { Button } from '@/components/ui/button'
import { useAuthForm } from '../../application/use-auth-form'
import { PasswordField } from './PasswordField'
import { AuthSocialActions } from './AuthSocialActions'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { submit, pending, error, confirmationError, clearConfirmationError } = useAuthForm(mode)
  const [recovery, setRecovery] = useState(false)
  const register = mode === 'register'
  return <>
    <p className="auth-intro" id="auth-description">{register ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.' : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}</p>
    <form className="auth-inner auth-form" aria-label={register ? 'Cadastro' : 'Login'} aria-busy={pending} onSubmit={(event) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      submit({ name: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), password: String(data.get('password') ?? ''), confirmation: String(data.get('confirmation') ?? '') })
    }}>
      <fieldset disabled={pending}>
        {register && <label className="auth-field"><span className="sr-only">Nome</span><input name="name" placeholder="Nome de usuário" {...fieldErrorProps(error, 'name', 'auth-error')} required minLength={2} maxLength={100} autoComplete="nickname" autoFocus /></label>}
        <label className="auth-field"><span className="sr-only">E-mail</span><input name="email" placeholder={register ? 'Digite seu e-mail' : 'contato@email.com'} {...fieldErrorProps(error, 'email', 'auth-error')} type="email" required maxLength={254} autoComplete="email" autoFocus={!register} /></label>
        <PasswordField register={register} error={error} onChange={clearConfirmationError} />
        {register && <PasswordField register confirmation error={null} confirmationError={confirmationError} onChange={clearConfirmationError} />}
      </fieldset>
      {confirmationError && <p id="confirmation-error" className="auth-validation" role="alert">{confirmationError}</p>}
      {!register && <button className="auth-forgot" type="button" aria-expanded={recovery} aria-controls="auth-recovery" onClick={() => setRecovery((value) => !value)}>Esqueceu a senha?</button>}
      {recovery && <p id="auth-recovery" className="auth-notice" role="status">O envio de e-mail de recuperação ainda não está configurado. Na demonstração, use ana.ribeiro@kurio.dev com a senha kurio1234. Se já estiver conectado, altere a senha em Meu perfil.</p>}
      <FormError error={error} id="auth-error" />
      <Button className="auth-submit" disabled={pending} type="submit" aria-label={!register ? 'Entrar na conta' : undefined}>{pending ? 'Enviando…' : register ? <><span className="auth-desktop-submit">Criar conta</span><span className="auth-mobile-submit">Criar perfil</span></> : 'Entrar'}</Button>
    </form>
    <AuthSocialActions disabled={pending} />
  </>
}
