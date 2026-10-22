import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { fieldErrorProps } from '@/components/ui/form-error-props'

interface PasswordFieldProps {
  register: boolean
  error: unknown
  onChange: () => void
  confirmation?: boolean
  confirmationError?: string | null
}
export function PasswordField({
  register,
  error,
  onChange,
  confirmation = false,
  confirmationError,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  const label = confirmation ? 'Confirmar senha' : 'Senha'
  return (
    <div className="auth-field">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <span className="auth-password">
        <input
          id={id}
          name={confirmation ? 'confirmation' : 'password'}
          placeholder={label}
          type={visible ? 'text' : 'password'}
          required
          minLength={register ? 8 : 1}
          maxLength={128}
          autoComplete={register ? 'new-password' : 'current-password'}
          {...fieldErrorProps(error, 'password', 'auth-error')}
          {...(confirmationError
            ? { 'aria-invalid': true, 'aria-describedby': 'confirmation-error' }
            : {})}
          onChange={onChange}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${confirmation ? 'confirmação de senha' : 'senha'}`}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <Eye size={22} aria-hidden="true" /> : <EyeOff size={22} aria-hidden="true" />}
        </button>
      </span>
    </div>
  )
}
