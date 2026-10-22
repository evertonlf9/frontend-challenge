import { expect, test } from '@playwright/test'
import { api, loginUi, prepare } from './support/api.js'

test.beforeEach(async ({ page }) => prepare(page))

test('catálogo rejeita contrato inválido e permite recuperar pela rede', async ({ page }) => {
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'invalid-catalog-response' })
  await page.goto('/?search=Emerald')
  await expect(page.getByRole('alert')).toContainText('servidor retornou dados inválidos')
  await expect(page.getByLabel('Catálogo').getByRole('link')).toHaveCount(0)
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'default' })
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByLabel('Catálogo').getByRole('link').first()).toBeVisible()
})

test('resposta inválida após persistência preserva tentativa e recupera uma única compra', async ({ page }) => {
  await loginUi(page)
  await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(page.getByText(/Carteira conectada à rede/)).toBeVisible()
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'invalid-order-response' })
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar compra simulada', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('servidor retornou dados inválidos')
  await expect(page.getByRole('button', { name: 'Recuperar tentativa anterior' })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Recuperar tentativa anterior' }).click()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  expect((await api<{ items: unknown[] }>(page, 'GET', '/orders')).data!.items).toHaveLength(1)
})
