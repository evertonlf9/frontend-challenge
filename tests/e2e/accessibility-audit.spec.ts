import { expect, test } from '@playwright/test'
import { api, loginUi, prepare } from './support/api.js'
import { expectAccessible } from './support/accessibility.js'

test.beforeEach(async ({ page }) => prepare(page))

for (const route of ['/', '/nft/nft-001', '/cart', '/login', '/register', '/profile', '/wallets', '/checkout', '/confirmation']) {
  test('WCAG e semântica: ' + route, async ({ page }, testInfo) => {
    if (['/profile', '/wallets', '/checkout', '/confirmation'].includes(route)) await loginUi(page)
    if (['/cart', '/checkout'].includes(route)) await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
    await page.goto(route)
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByLabel('Carregando', { exact: true })).toHaveCount(0)
    await expectAccessible(page, testInfo)
  })
}

test('revisão de compra mantém foco, retorna ao acionador e passa na auditoria', async ({ page }, testInfo) => {
  await loginUi(page)
  await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Conectar carteira simulada', exact: true }).click()
  await expect(page.getByText(/Carteira conectada à rede/)).toBeVisible()
  const trigger = page.getByRole('button', { name: 'Confirmar compra', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(dialog).toBeVisible()
  await expectAccessible(page, testInfo)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('busca fecha por Escape e devolve foco ao botão', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Abrir busca de NFTs' })
  await trigger.click()
  await expect(page.getByRole('textbox', { name: 'Buscar NFTs' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('search')).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('movimento reduzido desativa shimmer e o link de pular foca o conteúdo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'slow' })
  await page.goto('/nft/nft-002')
  const skeleton = page.locator('.skeleton').first()
  await expect(skeleton).toBeVisible()
  expect(await skeleton.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  const skip = page.getByRole('link', { name: 'Pular para conteúdo' })
  await skip.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#conteudo')).toBeFocused()
})

test('navegação para detalhe lento anuncia o título e foca o conteúdo carregado', async ({ page }) => {
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'slow' })
  await page.getByLabel('Catálogo', { exact: true }).getByRole('link').first().click()
  const title = page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })
  await expect(title).toBeVisible()
  await expect(title).toBeFocused()
  await expect(page).toHaveTitle('Emerald Ape #042 — Kurio')
})
