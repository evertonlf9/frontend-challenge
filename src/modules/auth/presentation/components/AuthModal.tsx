import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { HomePage } from '@/modules/nft/presentation/pages/HomePage'
import { parseMarketplaceSearch } from '@/modules/nft/application/parse-marketplace-search'
import { catalogSearch } from '@/modules/nft/application/catalog-search'
import { ReviewDialog } from '@/components/ui/ReviewDialog'
import { authBackgroundPath } from '../../application/auth-navigation'
import { AuthForm } from './AuthForm'

export function AuthModal({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const search = useSearch({ strict: false })
  const backgroundPath = authBackgroundPath(search.redirect)
  const backgroundSearch = catalogSearch(parseMarketplaceSearch(new URL(backgroundPath, window.location.origin).search))
  return <>
    <HomePage catalogParams={backgroundSearch} />
    <ReviewDialog open onClose={() => { void router.navigate({ href: backgroundPath }) }} initialFocus={mode === 'register' ? '[name="name"]' : '[name="email"]'} labelledBy="auth-title" describedBy="auth-description" className={`auth-modal auth-modal--${mode}`}>
      <button type="button" className="auth-close" aria-label="Fechar autenticação" onClick={() => { void router.navigate({ href: backgroundPath }) }}><X size={23} strokeWidth={1.25} aria-hidden="true" /></button>
      <p className="auth-mobile-brand">KURIO</p>
      <h1 id="auth-title" className="auth-title"><span className="auth-mobile-heading">{mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}</span><span className="auth-desktop-tabs"><Link to="/login" search={{ redirect: search.redirect }} aria-current={mode === 'login' ? 'page' : undefined}>Entrar</Link><span aria-hidden="true">|</span><Link to="/register" search={{ redirect: search.redirect }} aria-current={mode === 'register' ? 'page' : undefined}>Criar conta</Link></span></h1>
      <AuthForm mode={mode} />
      <p className="auth-mobile-switch">{mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}<Link to={mode === 'login' ? '/register' : '/login'} search={{ redirect: search.redirect }}>{mode === 'login' ? 'Crie uma conta' : 'Entre'}</Link></p>
    </ReviewDialog>
  </>
}
