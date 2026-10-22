/** Prefixo base compartilhado por todos os handlers REST do mock. */
export const apiUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
