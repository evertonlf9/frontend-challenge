import type { AuthResponse, LoginInput, RegisterInput } from '@/modules/auth/domain/auth.contracts'
import type { Nft, NftListParams, NftListResponse } from '@/modules/nft/domain/nft.contracts'
import type { FavoritesResponse } from '@/modules/favorites/domain/favorites.contracts'
import type {
  Cart,
  AddCartItemInput,
  UpdateCartItemInput,
} from '@/modules/cart/domain/cart.contracts'
import type { Quote, QuoteInput } from '@/modules/checkout/domain/quote.contracts'
import type {
  CreateOrderInput,
  Order,
  OrderListResponse,
} from '@/modules/orders/domain/order.contracts'
import type {
  Profile,
  UpdateProfileInput,
  ChangePasswordInput,
} from '@/modules/profile/domain/profile.contracts'
import type {
  Wallet,
  WalletListResponse,
  CreateWalletInput,
  UpdateWalletInput,
} from '@/modules/wallets/domain/wallet.contracts'

/** Contexto imutável da operação; impede associar uma resposta à sessão seguinte. */
export interface RequestContext {
  signal?: AbortSignal
  sessionToken?: string | null
}
export interface AuthRepository {
  login(input: LoginInput): Promise<AuthResponse>
  register(input: RegisterInput): Promise<AuthResponse>
  session(context?: RequestContext): Promise<AuthResponse>
  logout(context?: RequestContext): Promise<void>
}
export interface NftRepository {
  list(params: NftListParams, context?: RequestContext): Promise<NftListResponse>
  get(id: string, context?: RequestContext): Promise<Nft>
}
export interface FavoritesRepository {
  list(context?: RequestContext): Promise<FavoritesResponse>
  set(id: string, selected: boolean, context?: RequestContext): Promise<FavoritesResponse>
}
export interface CartRepository {
  get(context?: RequestContext): Promise<Cart>
  add(input: AddCartItemInput, context?: RequestContext): Promise<Cart>
  update(id: string, input: UpdateCartItemInput, context?: RequestContext): Promise<Cart>
  remove(id: string, context?: RequestContext): Promise<Cart>
}
export interface QuoteRepository {
  create(input: QuoteInput, context?: RequestContext): Promise<Quote>
}
export interface OrderRepository {
  list(context?: RequestContext): Promise<OrderListResponse>
  get(id: string, context?: RequestContext): Promise<Order>
  create(input: CreateOrderInput, context?: RequestContext): Promise<Order>
}
export interface ProfileRepository {
  get(context?: RequestContext): Promise<Profile>
  update(input: UpdateProfileInput, context?: RequestContext): Promise<Profile>
  changePassword(input: ChangePasswordInput, context?: RequestContext): Promise<void>
}
export interface WalletRepository {
  list(context?: RequestContext): Promise<WalletListResponse>
  create(input: CreateWalletInput, context?: RequestContext): Promise<Wallet>
  update(id: string, input: UpdateWalletInput, context?: RequestContext): Promise<Wallet>
  connect(
    id: string,
    network: string,
    context?: RequestContext
  ): Promise<{ walletId: string; network: string }>
  disconnect(id: string, context?: RequestContext): Promise<void>
}
export interface MarketplaceRepositories {
  auth: AuthRepository
  nfts: NftRepository
  favorites: FavoritesRepository
  cart: CartRepository
  quote: QuoteRepository
  orders: OrderRepository
  profile: ProfileRepository
  wallets: WalletRepository
}
