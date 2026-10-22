/** Contratos de sessão e conta. */
export interface Account {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Session {
  /** Token opaco usado no header Authorization. */
  token: string
  userId: string
  /** ISO 8601: quando a sessão deixa de ser aceita pela API. */
  expiresAt: string
}

export interface AuthResponse {
  account: Account
  session: Session
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
