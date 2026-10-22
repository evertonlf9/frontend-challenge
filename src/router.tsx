import { authSearch } from './modules/auth/application/auth-navigation'
import { parseMarketplaceSearch } from './modules/nft/application/parse-marketplace-search'
import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Link,
  lazyRouteComponent,
} from '@tanstack/react-router'
import { catalogSearch } from './modules/nft/application/catalog-search'
import { repositories } from './infrastructure/api/repositories'
import { queryClient } from './lib/query-client'
import { getSessionToken, getGuestCartId } from './lib/session-storage'
import { createQueries } from './modules/shared/application/queries'
import { isApiError } from './lib/api-error'
import { MainLayout } from './components/layout/MainLayout'
import { HomePage } from './modules/nft/presentation/pages/HomePage'
import { NftDetailPage } from './modules/nft/presentation/pages/NftDetailPage'
import { preloadArtwork, DETAIL_IMAGE_SIZES } from './modules/nft/presentation/preload-artwork'
const CartPage = lazyRouteComponent(
  () => import('./modules/cart/presentation/pages/CartPage'),
  'CartPage'
)
const CheckoutPage = lazyRouteComponent(
  () => import('./modules/checkout/presentation/pages/CheckoutPage'),
  'CheckoutPage'
)
const ConfirmationPage = lazyRouteComponent(
  () => import('./modules/checkout/presentation/pages/ConfirmationPage'),
  'ConfirmationPage'
)
const LoginPage = lazyRouteComponent(
  () => import('./modules/auth/presentation/pages/LoginPage'),
  'LoginPage'
)
const RegisterPage = lazyRouteComponent(
  () => import('./modules/auth/presentation/pages/RegisterPage'),
  'RegisterPage'
)
const ProfilePage = lazyRouteComponent(
  () => import('./modules/profile/presentation/pages/ProfilePage'),
  'ProfilePage'
)
const WalletsPage = lazyRouteComponent(
  () => import('./modules/profile/presentation/pages/WalletsPage'),
  'WalletsPage'
)

const rootRoute = createRootRoute({
  component: MainLayout,
  notFoundComponent: () => (
    <section className="p-8">
      <h1>Página não encontrada</h1>
      <Link to="/">Voltar ao início</Link>
    </section>
  ),
  errorComponent: ({ error, reset }) => (
    <section role="alert" className="p-8">
      <p>{error instanceof Error ? error.message : 'Falha ao carregar a página.'}</p>
      <button
        onClick={() => {
          reset()
          void queryClient.invalidateQueries()
        }}
      >
        Tentar novamente
      </button>
    </section>
  ),
})

async function requireAuthentication({ location }: { location: { href: string } }) {
  const token = getSessionToken()
  if (token) {
    try {
      return await queryClient.fetchQuery(
        createQueries(repositories, token, getGuestCartId()).session()
      )
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) throw error
    }
  }
  throw redirect({ to: '/login', search: { redirect: location.href } })
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
  validateSearch: catalogSearch,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$id',
  component: NftDetailPage,
  // Start REST while the route component downloads; useQuery shares this request.
  loader: ({ params, abortController }) => {
    if (typeof document === 'undefined') return
    if (document.getElementById('root')?.dataset.prerendered) return
    void queryClient
      .fetchQuery(createQueries(repositories, null, getGuestCartId()).nft(params.id))
      .then((nft) => {
        if (!abortController.signal.aborted)
          preloadArtwork(nft.galleryUrls[0] ?? nft.imageUrl, DETAIL_IMAGE_SIZES)
      })
      .catch(() => {
        /* useQuery renders the loading/error state and offers retry. */
      })
  },
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireAuthentication,
  component: CheckoutPage,
})

const confirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirmation',
  beforeLoad: requireAuthentication,
  validateSearch: (search: Record<string, unknown>): { orderId?: string } => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
  component: ConfirmationPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: authSearch,
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: authSearch,
  component: RegisterPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuthentication,
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: requireAuthentication,
  component: WalletsPage,
})

const routeTree = rootRoute.addChildren([
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/orders/$id',
    beforeLoad: requireAuthentication,
    component: ConfirmationPage,
  }),
  indexRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  confirmationRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
])

export const router = createRouter({
  routeTree,
  parseSearch: parseMarketplaceSearch,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
