import axios, { type AxiosRequestConfig } from 'axios'
import { parseApiError } from './api-error'
import { expireSessionToken, getGuestCartId, getSessionToken } from './session-storage'
import { waitForNetwork } from '@/network-ready'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use(async (config) => {
  await waitForNetwork()
  const token = getSessionToken()
  if (!config.headers.has('Authorization') && token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  if (!config.headers.has('x-cart-id')) config.headers.set('x-cart-id', getGuestCartId())
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    const failure = parseApiError(error)
    if (failure.code === 'SESSION_EXPIRED' || failure.code === 'UNAUTHENTICATED') {
      const header = axios.isAxiosError(error)
        ? String(error.config?.headers.Authorization ?? '')
        : ''
      expireSessionToken(header.replace(/^Bearer /, '') || null)
    }
    return Promise.reject(failure)
  }
)

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.get<T>(url, config)
  return response.data
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await http.post<T>(url, body, config)
  return response.data
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await http.patch<T>(url, body, config)
  return response.data
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await http.put<T>(url, body, config)
  return response.data
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.delete<T>(url, config)
  return response.data
}
