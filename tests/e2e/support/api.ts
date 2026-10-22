import { expect, type Page } from '@playwright/test'

export interface ApiResult<T> { status: number; data: T | null; code?: string }
export async function api<T = unknown>(page: Page, method: string, url: string, data?: unknown, token?: string | null): Promise<ApiResult<T>> {
  await page.locator("#conteudo").waitFor()
  return page.evaluate(async ({ method, url, data, token }) => {
    // @ts-expect-error Módulo servido pelo Vite no navegador de teste.
    const { http } = await import('/src/lib/http.ts')
    try {
      const headers: Record<string, string> = token !== undefined ? { Authorization: token ? `Bearer ${token}` : '' } : {}
      if (url === '/orders' && method === 'POST' && data && typeof data === 'object' && 'idempotencyKey' in data) headers['Idempotency-Key'] = String(data.idempotencyKey)
      const result = await http.request({ method, url, data, headers })
      return { status: result.status as number, data: result.data }
    } catch (error) {
      const failure = error as { status: number; code: string }
      return { status: failure.status, code: failure.code, data: null }
    }
  }, { method, url, data, token }) as Promise<ApiResult<T>>
}

export async function prepare(page: Page) {
  await page.clock.setFixedTime(new Date("2026-10-21T12:00:00.000Z"))
  // Os testes REST continuam passando pelo Axios e pelos handlers MSW.
  await page.route('https://coresg-normal.trae.ai/**', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#332822"/><circle cx="200" cy="200" r="110" fill="#c48c5c"/></svg>',
  }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO DO FUTURO/ })).toBeVisible()
  await expect(page.getByLabel('Catálogo').getByRole('link')).toHaveCount(9)
  await api(page, 'POST', '/__mocks/reset')
}

export async function loginApi(page: Page, who: 'ana' | 'bruno' = 'ana') {
  const credentials = who === 'ana' ? { email: 'ana.ribeiro@kurio.dev', password: 'kurio1234' } : { email: 'bruno.lima@kurio.dev', password: 'arte1234' }
  const result = await api<{ session: { token: string }; account: { id: string } }>(page, 'POST', '/auth/login', credentials)
  expect(result.status).toBe(200)
  return result.data!
}

export async function loginUi(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('ana.ribeiro@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('kurio1234')
  await page.getByRole('button', { name: 'Entrar na conta' }).click()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
}

export async function orderInput(page: Page, token: string, chain = 'ethereum') {
  const result = await api<{ items: { id: string; network: string; available: number; maxPerOrder: number }[] }>(page, 'GET', `/nfts?network=${chain}&pageSize=24`)
  const nft = result.data!.items.find((item) => item.available > 1 && item.maxPerOrder > 1)!
  expect(nft).toBeTruthy()
  const quote = await api<{ id: string }>(page, 'POST', '/quote', { items: [{ nftId: nft.id, quantity: 1 }] }, token)
  expect(quote.status).toBe(200)
  return {
    quoteId: quote.data!.id, items: [{ nftId: nft.id, quantity: 1 }],
    walletId: chain === 'ethereum' ? 'wallet-ana-primary' : 'wallet-bruno-primary', network: chain,
    couponCode: null, collector: { name: 'Colecionador', email: 'colecionador@example.test' }, idempotencyKey: 'same-attempt-123',
  }
}
