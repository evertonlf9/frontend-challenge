import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { fieldErrorProps } from '@/components/ui/form-error-props'

export function AccountPasswordField({ label, name, error, confirmationError, onChange }: { label: string; name: string; error: unknown; confirmationError?: string | null; onChange: () => void }) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  return <div className="account-field"><label htmlFor={id}>{label}</label><span className="account-password"><input id={id} name={name} type={visible ? 'text' : 'password'} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} minLength={name === 'currentPassword' ? 1 : 8} maxLength={128} {...fieldErrorProps(error, name, 'password-error')} {...(confirmationError ? { 'aria-invalid': true, 'aria-describedby': 'password-confirmation-error' } : {})} onChange={onChange} /><button type="button" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} onClick={() => setVisible((value) => !value)} aria-pressed={visible}>{visible ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}</button></span></div>
}
