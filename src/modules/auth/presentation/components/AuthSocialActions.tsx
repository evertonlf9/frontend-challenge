import { useState } from 'react'

function GoogleIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.4c-.2 1.2-.9 2.2-2 2.9v2.7h3.4c2-1.8 2.8-4.4 2.8-7.6Z" /><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.8-2.5l-3.4-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H2.9v2.8A10.2 10.2 0 0 0 12 22Z" /><path fill="#fbbc05" d="M6.4 13.7A6 6 0 0 1 6 12c0-.6.1-1.2.4-1.8V7.5H2.9A10 10 0 0 0 2 12c0 1.6.3 3.1.9 4.5l3.5-2.8Z" /><path fill="#ea4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5L18.7 5A9.7 9.7 0 0 0 12 2a10.2 10.2 0 0 0-9.1 5.5l3.5 2.7C7.2 7.8 9.4 6.1 12 6.1Z" /></svg>
}

export function AuthSocialActions({ disabled }: { disabled: boolean }) {
  const [provider, setProvider] = useState<string | null>(null)
  return <div className="auth-social">
    <p className="auth-divider"><span>Ou continue com</span></p>
    <div className="auth-inner auth-social-buttons">
      <button type="button" disabled={disabled} onClick={() => setProvider('Google')}><GoogleIcon />Continuar com Google</button>
      <button type="button" disabled={disabled} onClick={() => setProvider('Facebook')}><svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4267a9" d="M14 22v-9h3l.5-4H14V6.5c0-1 .3-1.5 1.6-1.5H18V1.4A25 25 0 0 0 14.7 1C11.5 1 10 3 10 6v3H7v4h3v9Z" /></svg>Continuar com Facebook</button>
      {provider && <p className="auth-notice" role="status">A integração com {provider} ainda não está configurada. Entre com e-mail e senha ou crie uma conta.</p>}
    </div>
  </div>
}
