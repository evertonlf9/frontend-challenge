import { expect, test } from '@playwright/test'
import { api, loginUi, prepare } from './support/api.js'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page)
})

test('carrinho em cards e pagamento mobile permitem revisar e concluir a compra', async ({ page }) => {
  await loginUi(page)
  await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
  await page.goto('/cart')
  await expect(page.locator('.site-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  const quantity = page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042', exact: true })
  await page.getByRole('button', { name: 'Aumentar Quantidade de Emerald Ape #042', exact: true }).click()
  await expect(quantity).toHaveValue('2')
  const image = page.getByRole('table').getByRole('img', { name: /^Emerald Ape #042/ })
  expect((await image.boundingBox())!.width).toBeGreaterThanOrEqual(80)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('link', { name: 'Continuar para pagamento: Conectar e finalizar' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento', exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Selecionar carteira Carteira principal', exact: true })).toBeChecked()
  await page.getByRole('radio', { name: 'WalletConnect', exact: true }).check()
  await page.getByRole('button', { name: 'Conectar carteira simulada', exact: true }).click()
  await expect(page.getByText(/Carteira conectada à rede/)).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar e editar', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar compra simulada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
})

test('cadastro mobile usa tela inteira e confirma senha com controle de visibilidade', async ({ page }) => {
  await page.goto('/register')
  const dialog = page.getByRole('dialog')
  await expect(page.getByRole('heading', { name: 'Criar perfil de colecionador', exact: true })).toBeVisible()
  const box = (await dialog.boundingBox())!
  expect(box.x).toBe(0)
  expect(box.width).toBe(390)
  expect(box.height).toBe(844)
  await page.getByLabel('Confirmar senha', { exact: true }).fill('senha1234')
  await page.getByRole('button', { name: 'Mostrar confirmação de senha', exact: true }).click()
  await expect(page.getByLabel('Confirmar senha', { exact: true })).toHaveAttribute('type', 'text')
  await dialog.getByRole('link', { name: 'Entre', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
})
