import '@/styles/account.css'
import { useState, type ReactNode } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import {
  UserRound,
  MapPin,
  ShoppingCart,
  Heart,
  BadgePercent,
  Download,
  TriangleAlert,
  LogOut,
} from 'lucide-react'
import { useLogout } from '@/modules/shared/application/use-marketplace'
import { ReviewDialog } from '@/components/ui/ReviewDialog'
import { Button } from '@/components/ui/button'

export function AccountLayout({ children }: { children: ReactNode }) {
  const location = useRouterState({ select: (state) => state.location })
  const logout = useLogout()
  const navigate = useNavigate()
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <div className="account-layout">
      <aside className="account-sidebar" aria-label="Meu perfil">
        <h2>Meu perfil</h2>
        <nav aria-label="Navegação do perfil">
          <Link
            activeOptions={{ exact: true, includeHash: true }}
            to="/profile"
            aria-current={
              location.pathname === '/profile' && location.hash !== 'favoritos' ? 'page' : undefined
            }
          >
            <UserRound size={16} aria-hidden="true" />
            Dados do perfil
          </Link>
          <Link
            activeOptions={{ exact: true, includeHash: true }}
            to="/wallets"
            aria-current={location.pathname === '/wallets' ? 'page' : undefined}
          >
            <MapPin size={16} aria-hidden="true" />
            Carteiras
          </Link>
          <Link
            activeOptions={{ exact: true, includeHash: true }}
            to="/confirmation"
            aria-current={location.pathname === '/confirmation' ? 'page' : undefined}
          >
            <ShoppingCart size={16} aria-hidden="true" />
            Atividade
          </Link>
          <Link
            activeOptions={{ exact: true, includeHash: true }}
            to="/profile"
            hash="favoritos"
            aria-current={location.hash === 'favoritos' ? 'page' : undefined}
          >
            <Heart size={16} aria-hidden="true" />
            Lista de interesse
          </Link>
          <button onClick={() => setNotice('Ofertas')}>
            <BadgePercent size={16} aria-hidden="true" />
            Ofertas
          </button>
          <button onClick={() => setNotice('Arquivos baixados')}>
            <Download size={16} aria-hidden="true" />
            Arquivos baixados
          </button>
          <button onClick={() => setNotice('Suporte')}>
            <TriangleAlert size={16} aria-hidden="true" />
            Suporte
          </button>
        </nav>
        <button
          className="account-signout"
          aria-label="Sair do perfil"
          disabled={logout.isPending}
          onClick={() => {
            logout.mutate()
            void navigate({ to: '/' })
          }}
        >
          <LogOut size={16} aria-hidden="true" />
          Sair
        </button>
      </aside>
      <div className="account-content">{children}</div>
      <ReviewDialog
        open={!!notice}
        onClose={() => setNotice(null)}
        labelledBy="account-notice-title"
      >
        <h2 id="account-notice-title">{notice}</h2>
        <p className="my-5">
          {notice === 'Suporte'
            ? 'O suporte ainda não está configurado nesta demonstração. Consulte a documentação do projeto para executar e testar os fluxos.'
            : 'Esta área ainda não está disponível na demonstração.'}
        </p>
        <Button onClick={() => setNotice(null)}>Fechar</Button>
      </ReviewDialog>
    </div>
  )
}
