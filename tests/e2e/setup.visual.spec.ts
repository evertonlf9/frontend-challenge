import { expect, test, type Page } from '@playwright/test'
import { api, loginUi, prepare } from './support/api.js'

async function waitForAssets(page: Page) {
  await page.evaluate(async () => { await document.fonts.ready; for (const image of document.images) image.loading = 'eager'; await Promise.all([...document.images].map((image) => image.decode().catch(() => {}))) })
}

test.beforeEach(async ({ page }) => prepare(page))
for (const route of ['/', '/nft/nft-001', '/cart', '/checkout', '/login', '/register', '/profile', '/wallets', '/confirmation']) {
  test('regressão visual: ' + route, async ({ page }) => {
    if (['/checkout', '/profile', '/wallets', '/confirmation'].includes(route)) await loginUi(page)
    if (route === '/cart' || route === '/checkout') {
      const list = await api<{ items: { id: string; available: number }[] }>(page, 'GET', '/nfts?network=ethereum&pageSize=24')
      const nft = list.data!.items.find((item) => item.available > 1)!
      await api(page, 'POST', '/cart/items', { nftId: nft.id, quantity: 1 })
    }
    let target = route
    if (route === '/confirmation') {
      const list = await api<{ items: { id: string; available: number }[] }>(page, 'GET', '/nfts?network=ethereum&pageSize=24')
      const items = list.data!.items.filter((item) => item.available > 1).slice(0, 3).map((nft) => ({ nftId: nft.id, quantity: 1 }))
      const quote = await api<{ id: string }>(page, 'POST', '/quote', { items })
      const result = await api<{ id: string }>(page, 'POST', '/orders', { quoteId: quote.data!.id, items, walletId: 'wallet-ana-primary', network: 'ethereum', collector: { name: 'Ana Ribeiro', email: 'ana.ribeiro@kurio.dev', walletProvider: 'MetaMask' }, idempotencyKey: 'visual-receipt-2026' })
      expect(result.status).toBe(201)
      target += '?orderId=' + result.data!.id
    }
    await page.goto(target)
    const heading = route === '/login' || route === '/register' ? '.auth-title' : route === '/confirmation' ? '#receipt-title' : 'main h1'
    await expect(page.locator(heading)).toBeVisible()
    await expect(page.getByLabel('Carregando')).toHaveCount(0)
    await waitForAssets(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const fullPage = ['/', '/nft/nft-001', '/cart', '/checkout'].includes(route)
    await expect(page).toHaveScreenshot((route === '/' ? 'inicio' : route.replaceAll('/', '-')) + '.png', { fullPage, animations: 'disabled' })
  })
}

test('regressão visual: modal de leitura', async ({ page }) => {
  await page.getByRole('button', { name: /Ler mais.*Raridade/ }).click()
  await expect(page.getByRole('dialog', { name: 'Raridade, atributos e procedência' })).toBeVisible()
  await waitForAssets(page)
  await expect(page).toHaveScreenshot('modal-leitura.png', { animations: 'disabled' })
})

test('regressão visual: revisão do pedido', async ({ page }) => {
  await loginUi(page)
  await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(page.getByText(/Carteira conectada à rede/)).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toBeVisible()
  await waitForAssets(page)
  await expect(page).toHaveScreenshot('modal-revisao.png', { animations: 'disabled' })
})
