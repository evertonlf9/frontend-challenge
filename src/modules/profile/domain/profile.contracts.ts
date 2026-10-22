export interface Profile {
  id: string
  name: string
  email: string
  handle: string
  bio: string
  avatarUrl: string
  walletLabel?: string
  ensName?: string
  usePrimaryForSecondary?: boolean
  updatedAt: string
}

export interface UpdateProfileInput {
  name?: string
  email?: string
  handle?: string
  bio?: string
  avatarUrl?: string
  walletLabel?: string
  ensName?: string
  usePrimaryForSecondary?: boolean
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}
