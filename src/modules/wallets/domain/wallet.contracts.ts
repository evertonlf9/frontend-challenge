import type { NetworkId } from '@/modules/nft/domain/nft.contracts'

export const WALLET_PROVIDERS = ['MetaMask', 'WalletConnect', 'Coinbase Wallet'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export interface WalletDetails {
  displayName?: string
  profileName?: string
  email?: string
  provider?: WalletProvider
  referralCode?: string
  ensName?: string
  secondaryAddress?: string
}
export interface Wallet extends WalletDetails {
  id: string
  label: string
  address: string
  network: NetworkId
  isPrimary: boolean
  verified: boolean
  createdAt: string
  updatedAt: string
}
export interface WalletListResponse {
  items: Wallet[]
}
export interface CreateWalletInput extends WalletDetails {
  label: string
  address: string
  network: NetworkId
  isPrimary?: boolean
}
export type UpdateWalletInput = Partial<CreateWalletInput>
