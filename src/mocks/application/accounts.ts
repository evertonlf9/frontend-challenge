import type { AuthResponse } from '@/modules/auth/domain/auth.contracts'
import type { Profile } from '@/modules/profile/domain/profile.contracts'
import { WALLET_PROVIDERS } from '@/modules/wallets/domain/wallet.contracts'
import type { Wallet, WalletDetails } from '@/modules/wallets/domain/wallet.contracts'
import type { MockStore } from '../domain/store'
import { hashPassword, verifyPassword } from '../db/password'
import { ensName, email, fail, invalid, network, record, text } from './validation'

export function createAccounts(store: MockStore) {
  const authenticate = (token: string | null) => {
    if (!token) fail('UNAUTHENTICATED', 401)
    const session = store.read().sessions.find((item) => item.token === token)
    if (!session || Date.parse(session.expiresAt) <= store.now() || store.read().scenario === 'session-expired') fail('SESSION_EXPIRED', 401)
    const user = store.read().users.find((item) => item.id === session.userId)
    if (!user) fail('SESSION_EXPIRED', 401)
    return { user, session }
  }
  const response = (userId: string, guestId?: string): AuthResponse => store.transaction((state) => {
    const user = state.users.find((item) => item.id === userId)!
    const session = { token: crypto.randomUUID(), userId, expiresAt: new Date(store.now() + 2 * 60 * 60_000).toISOString() }
    state.sessions.push(session)
    if (guestId) {
      const guestKey = `guest:${guestId}`
      const merged = new Map((state.carts[userId] ?? []).map((line) => [line.nftId, line.quantity]))
      for (const line of state.carts[guestKey] ?? []) {
        const nft = state.nfts.find((item) => item.id === line.nftId)
        if (nft && nft.available > 0) merged.set(nft.id, Math.min(nft.available, nft.maxPerOrder, (merged.get(nft.id) ?? 0) + line.quantity))
      }
      state.carts[userId] = [...merged].map(([nftId, quantity]) => ({ nftId, quantity }))
      delete state.carts[guestKey]
    }
    const { passwordHash: _, ...account } = user
    return { account, session }
  })
  return {
    authenticate,
    session(token: string | null): AuthResponse {
      const { user, session } = authenticate(token)
      const { passwordHash: _, ...account } = user
      return { account, session }
    },
    login(input: unknown, guestId?: string) {
      const body = record(input)
      const address = email(body.email)
      const password = text(body.password, 'password', 1, 128)
      const user = store.read().users.find((item) => item.email === address)
      if (!user || !verifyPassword(password, user.id, user.passwordHash)) fail('INVALID_CREDENTIALS', 401)
      return response(user.id, guestId)
    },
    register(input: unknown, guestId?: string) {
      const body = record(input)
      const address = email(body.email)
      const name = text(body.name, 'name', 2, 100)
      const password = text(body.password, 'password', 8, 128)
      if (store.read().users.some((item) => item.email === address)) fail('CONFLICT', 409, 'E-mail já cadastrado.')
      const id = store.id('user')
      store.transaction((state) => {
        const now = new Date(store.now()).toISOString()
        state.users.push({ id, name, email: address, passwordHash: hashPassword(password, id), createdAt: now })
        state.profiles[id] = { id, name, email: address, handle: `@collector-${id}`, bio: '', avatarUrl: '/favicon.svg', updatedAt: now }
        state.wallets[id] = []
        state.favorites[id] = []
      })
      return response(id, guestId)
    },
    logout(token: string | null) {
      store.transaction((state) => { state.sessions = state.sessions.filter((item) => item.token !== token) })
    },
    expire(token: string | null) {
      const auth = authenticate(token)
      store.transaction((state) => { state.sessions.find((item) => item.token === auth.session.token)!.expiresAt = new Date(store.now() - 1).toISOString() })
    },
    profile(userId: string): Profile { return structuredClone(store.read().profiles[userId]) },
    updateProfile(userId: string, input: unknown) {
      const body = record(input)
      const changes: Partial<Profile> = {}
      if (body.name !== undefined) changes.name = text(body.name, 'name', 2, 100)
      if (body.handle !== undefined) {
        changes.handle = text(body.handle, 'handle', 2, 40)
        if (!/^@[a-zA-Z0-9._-]+$/.test(changes.handle)) invalid('handle', 'Use @ e letras, números, pontos, hífen ou sublinhado.')
        if (Object.values(store.read().profiles).some((item) => item.id !== userId && item.handle === changes.handle)) fail('CONFLICT', 409, 'Identificador já cadastrado.')
      }
      if (body.email !== undefined) {
        changes.email = email(body.email)
        if (store.read().users.some((item) => item.id !== userId && item.email === changes.email)) invalid('email', 'E-mail já cadastrado.')
      }
      if (body.walletLabel !== undefined) changes.walletLabel = text(body.walletLabel, 'walletLabel', 0, 80)
      if (body.ensName !== undefined) changes.ensName = ensName(body.ensName)
      if (body.usePrimaryForSecondary !== undefined) {
        if (typeof body.usePrimaryForSecondary !== 'boolean') invalid('usePrimaryForSecondary', 'Informe um booleano.')
        if (body.usePrimaryForSecondary && !(store.read().wallets[userId] ?? []).some((wallet) => wallet.isPrimary)) invalid('usePrimaryForSecondary', 'Cadastre uma carteira principal primeiro.')
        changes.usePrimaryForSecondary = body.usePrimaryForSecondary
      }
      if (body.bio !== undefined) changes.bio = text(body.bio, 'bio', 0, 500)
      if (body.avatarUrl !== undefined) {
        const value = text(body.avatarUrl, 'avatarUrl', 0, 2_000_000)
        if (value && !/^\/(artwork\/[a-z0-9.-]+|favicon\.svg)$/.test(value) && !/^https?:\/\//.test(value) && !/^data:image\/(png|jpeg|webp);base64,/.test(value)) invalid('avatarUrl', 'Use uma URL HTTP(S) ou imagem PNG/JPEG/WebP em base64.')
        changes.avatarUrl = value
      }
      return store.transaction((state) => {
        Object.assign(state.profiles[userId], changes, { updatedAt: new Date(store.now()).toISOString() })
        const user = state.users.find((item) => item.id === userId)!
        user.name = state.profiles[userId].name
        user.email = state.profiles[userId].email
        return state.profiles[userId]
      })
    },
    changePassword(userId: string, currentToken: string, input: unknown) {
      const body = record(input)
      const current = text(body.currentPassword, 'currentPassword', 1, 128)
      const next = text(body.newPassword, 'newPassword', 8, 128)
      const user = store.read().users.find((item) => item.id === userId)!
      if (!verifyPassword(current, userId, user.passwordHash)) invalid('currentPassword', 'Senha atual incorreta.')
      store.transaction((state) => {
        state.users.find((item) => item.id === userId)!.passwordHash = hashPassword(next, userId)
        state.sessions = state.sessions.filter((session) => session.userId !== userId || session.token === currentToken)
      })
    },
    wallets(userId: string) { return { items: structuredClone(store.read().wallets[userId] ?? []) } },
    connectWallet(userId: string, id: string, input: unknown) {
      const wallet = (store.read().wallets[userId] ?? []).find((item) => item.id === id)
      if (!wallet) fail('NOT_FOUND', 404)
      const chain = network(record(input).network)
      if (chain !== wallet.network) invalid('network', 'A rede selecionada é incompatível com a carteira.')
      if (store.read().scenario === 'wallet-refused') fail('PAYMENT_DECLINED', 422, 'Conexão recusada pela carteira simulada.')
      return { walletId: id, network: chain }
    },
    saveWallet(userId: string, input: unknown, id?: string): Wallet {
      const body = record(input)
      const wallets = store.read().wallets[userId] ?? []
      const existing = id ? wallets.find((item) => item.id === id) : undefined
      if (id && !existing) fail('NOT_FOUND', 404)
      const details: WalletDetails = {}
      for (const field of ['displayName', 'profileName', 'referralCode', 'secondaryAddress'] as const) {
        if (body[field] !== undefined) details[field] = text(body[field], field, 0, field === 'referralCode' ? 40 : 100)
        else if (existing?.[field] !== undefined) details[field] = existing[field]
      }
      if (body.email !== undefined) details.email = email(body.email)
      else if (existing?.email) details.email = existing.email
      if (body.ensName !== undefined) details.ensName = ensName(body.ensName)
      else if (existing?.ensName) details.ensName = existing.ensName
      if (body.provider !== undefined) {
        if (!WALLET_PROVIDERS.includes(body.provider as WalletDetails['provider'] & string)) invalid('provider', 'Selecione um tipo de carteira válido.')
        details.provider = body.provider as WalletDetails['provider']
      } else if (existing?.provider) details.provider = existing.provider
      if (details.secondaryAddress && !/^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}|[a-zA-Z0-9-]+\.(eth|sol|polygon))$/.test(details.secondaryAddress)) invalid('secondaryAddress', 'Informe um endereço de carteira ou nome ENS válido.')
      const label = body.label === undefined && existing ? existing.label : text(body.label, 'label', 2, 80)
      const address = body.address === undefined && existing ? existing.address : text(body.address, 'address', 20, 100)
      const chain = network(body.network ?? existing?.network)
      if (chain !== 'solana' && !/^0x[a-fA-F0-9]{40}$/.test(address)) invalid('address', 'Endereço EVM inválido.')
      if (chain === 'solana' && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) invalid('address', 'Endereço Solana inválido.')
      if (body.isPrimary !== undefined && typeof body.isPrimary !== 'boolean') invalid('isPrimary', 'Informe um booleano.')
      if (wallets.some((item) => item.id !== id && item.network === chain && (chain === 'solana' ? item.address === address : item.address.toLowerCase() === address.toLowerCase()))) fail('CONFLICT', 409, 'Carteira já cadastrada.')
      return store.transaction((state) => {
        const now = new Date(store.now()).toISOString()
        const item: Wallet = { ...details, id: id ?? store.id('wallet'), label, address, network: chain, isPrimary: body.isPrimary === true || wallets.length === 0 || (body.isPrimary === undefined && !!existing?.isPrimary), verified: false, createdAt: existing?.createdAt ?? now, updatedAt: now }
        if (existing?.isPrimary && !item.isPrimary && !wallets.some((other) => other.id !== id && other.isPrimary)) invalid('isPrimary', 'Selecione outra carteira principal primeiro.')
        state.wallets[userId] = wallets.filter((other) => other.id !== id).map((other) => item.isPrimary ? { ...other, isPrimary: false } : other).concat(item)
        return item
      })
    },
  }
}
