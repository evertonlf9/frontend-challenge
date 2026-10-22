import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import { Search, ShoppingCart, LogIn, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useLogout, useMarketplace, useSession } from '@/modules/shared/application/use-marketplace'
import { catalogSearch } from '@/modules/nft/application/catalog-search'

export function Header() {
  const { queries } = useMarketplace()
  const cart = useQuery(queries.cart())
  const session = useSession()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useRouterState({ select: (state) => state.location })
  const currentSearch = useSearch({ strict: false })
  const [searchOpen, setSearchOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const searchTrigger = useRef<HTMLButtonElement>(null)
  const accountMenu = useRef<HTMLDetailsElement>(null)

  const closeSearch = () => {
    setSearchOpen(false)
    searchTrigger.current?.focus()
  }
  useEffect(() => {
    if (searchOpen) input.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (accountMenu.current) accountMenu.current.open = false
  }, [location.href])

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      const menu = accountMenu.current
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false
      }
    }

    function handleEscape(event: KeyboardEvent) {
      const menu = accountMenu.current
      if (event.key !== 'Escape' || !menu?.open) return

      event.preventDefault()
      menu.open = false
      menu.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function closeAccountMenu() {
    const menu = accountMenu.current
    if (!menu) return

    menu.open = false
    menu.querySelector('summary')?.focus()
  }

  const marketplaceActive =
    (location.pathname !== '/' &&
      !['/login', '/register', '/profile', '/wallets'].includes(location.pathname)) ||
    location.hash === 'catalogo'
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <Link to="/" className="brand" aria-label="Kurio — início">
          KURIO
        </Link>
        <nav className="primary-nav" aria-label="Navegação principal">
          <Link
            to="/"
            activeOptions={{ exact: true, includeHash: true }}
            aria-current={location.pathname === '/' && !location.hash ? 'page' : undefined}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            activeOptions={{ exact: true, includeHash: true }}
            aria-current={marketplaceActive ? 'page' : undefined}
          >
            Mercado
          </Link>
          <Link to="/" hash="criadores" activeOptions={{ exact: true, includeHash: true }}>
            Criadores
          </Link>
          <Link to="/" hash="aprenda" activeOptions={{ exact: true, includeHash: true }}>
            Aprenda
          </Link>
        </nav>
        <div className="header-actions">
          <button
            ref={searchTrigger}
            className="icon-button"
            aria-label="Abrir busca de NFTs"
            aria-expanded={searchOpen}
            aria-controls={searchOpen ? 'catalog-search' : undefined}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search size={22} aria-hidden="true" />
          </button>
          <Link
            to="/cart"
            className="icon-button"
            aria-label={`Carrinho, ${cart.data?.itemCount ?? 0} itens`}
          >
            <ShoppingCart size={23} aria-hidden="true" />
            <span aria-hidden="true" className="cart-badge">
              {cart.data?.itemCount ?? 0}
            </span>
          </Link>
          {session.data ? (
            <div className="header-account">
              <details
                ref={accountMenu}
                className="account-menu"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    event.currentTarget.open = false
                  }
                }}
              >
                <summary
                  aria-label={`Abrir menu da conta: ${session.data.account.name.split(' ')[0]}`}
                >
                  {session.data.account.name.split(' ')[0]} <span aria-hidden="true">▾</span>
                </summary>
                <div className="account-dropdown">
                  <Link to="/profile" onClick={closeAccountMenu}>
                    Meu perfil
                  </Link>
                  <Link to="/wallets" onClick={closeAccountMenu}>
                    Carteiras
                  </Link>
                  <Link to="/confirmation" onClick={closeAccountMenu}>
                    Meus pedidos
                  </Link>
                </div>
              </details>
              <Button
                variant="ghost"
                size="sm"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                Sair
              </Button>
            </div>
          ) : (
            <Button asChild className="header-login">
              <Link
                to="/login"
                search={{
                  redirect:
                    location.pathname === '/login' || location.pathname === '/register'
                      ? currentSearch.redirect
                      : location.href,
                }}
              >
                <LogIn size={19} aria-hidden="true" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
      {searchOpen && (
        <form
          id="catalog-search"
          role="search"
          className="site-container header-search"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              closeSearch()
            }
          }}
          onSubmit={(event) => {
            event.preventDefault()
            const value = String(new FormData(event.currentTarget).get('search') ?? '')
            void navigate({
              to: '/',
              hash: 'catalogo',
              search: { ...catalogSearch(currentSearch), search: value, page: 1 },
            })
            setSearchOpen(false)
          }}
        >
          <label>
            Buscar NFTs
            <input
              ref={input}
              name="search"
              className="field-input"
              defaultValue={catalogSearch(currentSearch).search}
              placeholder="Nome do NFT ou coleção"
            />
          </label>
          <Button type="submit">Buscar</Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigate({ to: '/', search: {} })
              setSearchOpen(false)
            }}
          >
            Limpar filtros
          </Button>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar busca"
            onClick={closeSearch}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </form>
      )}
    </header>
  )
}
