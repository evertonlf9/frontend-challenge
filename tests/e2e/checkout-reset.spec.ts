import { expect, test, type Page } from '@playwright/test'
import { api, loginUi, prepare } from './support/api.js'

test.beforeEach(async ({ page }) => prepare(page))

async function startCheckout(page: Page) {
  await loginUi(page)
  const session = await api<{ account: { id: string } }>(page, 'GET', '/auth/session')
  await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
  await page.goto('/checkout')
  await page.getByLabel('Nome de exibição obrigatório', { exact: true }).fill('Nome do pedido anterior')
  await page.getByLabel('Nome ENS', { exact: true }).fill('colecionador.eth')
  await page.getByLabel('Código de indicação', { exact: true }).fill('COMPRA-ANTERIOR')
  await page.getByLabel('Observação do colecionador (opcional)', { exact: true }).fill('Observação da compra anterior')
  await page.getByLabel('Cupom', { exact: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar cupom', exact: true }).click()
  await page.getByRole('radio', { name: 'WalletConnect', exact: true }).check()
  await page.getByRole('button', { name: 'Conectar carteira simulada', exact: true }).click()
  await expect(page.getByText(/Carteira conectada à rede/)).toBeVisible()
  return session.data!.account.id
}
async function submit(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar compra simulada', exact: true }).click()
}
async function draft(page: Page, owner: string) {
  return page.evaluate((id) => sessionStorage.getItem('kurio.checkout.draft:' + id), owner)
}
async function expectCleared(page: Page, owner: string) {
  await expect.poll(() => draft(page, owner)).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('kurio.cart.coupon'))).toBe('')
  expect((await api<{ items: unknown[] }>(page, 'GET', '/cart')).data!.items).toHaveLength(0)
}

test('compra confirmada limpa rascunho, cupom e NFTs comprados e inicia o próximo formulário com os padrões', async ({ page }) => {
  const owner = await startCheckout(page)
  await submit(page)
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await expectCleared(page, owner)
  await page.goto('/cart')
  await expect(page.getByText('Nenhum resultado encontrado.', { exact: true })).toBeVisible()
  await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
  await page.goto('/checkout')
  await expect(page.getByLabel('Nome de exibição obrigatório', { exact: true })).toHaveValue('Ana Ribeiro')
  await expect(page.getByLabel('Nome ENS', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Código de indicação', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Observação do colecionador (opcional)', { exact: true })).toHaveValue('')
  await expect(page.getByRole('radio', { name: 'MetaMask', exact: true })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
})

test('pagamento recusado preserva rascunho, cupom e NFTs selecionados', async ({ page }) => {
  const owner = await startCheckout(page)
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'payment-declined' })
  await submit(page)
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  expect(await draft(page, owner)).toContain('Observação da compra anterior')
  expect(await page.evaluate(() => localStorage.getItem('kurio.cart.coupon'))).toBe('KURIO10')
  expect((await api<{ items: unknown[] }>(page, 'GET', '/cart')).data!.items).toHaveLength(1)
  await page.goto('/checkout')
  await expect(page.getByLabel('Observação do colecionador (opcional)', { exact: true })).toHaveValue('Observação da compra anterior')
})

test('pedido pendente preserva dados até a confirmação e então limpa o checkout', async ({ page }) => {
  const owner = await startCheckout(page)
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'payment-pending' })
  await submit(page)
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  expect(await draft(page, owner)).not.toBeNull()
  const id = new URL(page.url()).pathname.split('/orders/')[1]
  await api(page, 'POST', '/__mocks/orders/' + id + '/settle', { status: 'confirmed' })
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await expectCleared(page, owner)
})

test('timeout preserva o rascunho e a recuperação confirmada limpa a mesma tentativa', async ({ page }) => {
  const owner = await startCheckout(page)
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'order-timeout' })
  await submit(page)
  await expect(page.getByRole('alert')).toContainText('demorou demais', { timeout: 20_000 })
  expect(await draft(page, owner)).not.toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('kurio.cart.coupon'))).toBe('KURIO10')
  await page.reload()
  await page.getByRole('button', { name: 'Recuperar tentativa anterior', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await expectCleared(page, owner)
  expect((await api<{ items: unknown[] }>(page, 'GET', '/orders')).data!.items).toHaveLength(1)
})
