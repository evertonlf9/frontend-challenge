import { expect, test } from '@playwright/test'
import { api, prepare } from './support/api.js'

test.beforeEach(async ({ page }) => prepare(page))

test('Tab percorre a apresentação completa sem precisar ativar a leitura', async ({ page }) => {
  const hero = page.getByRole('region', { name: 'Destaques da Kurio' })
  const welcome = hero.getByText('Bem-vindo à Kurio', { exact: true })
  const title = hero.getByRole('heading', { level: 1 })
  const description = hero.locator('p')
  const explore = hero.getByRole('button', { name: 'EXPLORAR', exact: true })
  const image = hero.getByRole('img')

  await expect(welcome).toHaveAttribute('tabindex', '0')
  await expect(page.getByLabel('Acessibilidade', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Leitura por Tab/ })).toHaveCount(0)
  await page.getByRole('link', { name: 'Entrar', exact: true }).focus()

  for (const target of [welcome, title, description, explore, image]) {
    await page.keyboard.press('Tab')
    await expect(target).toBeFocused()
  }

  await page.keyboard.press('Tab')
  await expect(hero.getByRole('button', { name: 'Destaque 1', exact: true })).toBeFocused()
  for (const target of [image, explore, description, title, welcome]) {
    await page.keyboard.press('Shift+Tab')
    await expect(target).toBeFocused()
  }
})

test('leitura permanece disponível após refresh mesmo com a preferência antiga desativada', async ({
  page,
}) => {
  await page.evaluate(() => localStorage.setItem('kurio.accessibility.reading-mode', 'false'))
  await page.reload()
  const title = page.getByRole('heading', { name: /SEJA DONO DO FUTURO/ })
  const welcome = page.getByText('Bem-vindo à Kurio', { exact: true })
  await expect(welcome).toHaveAttribute('tabindex', '0')
  await welcome.focus()
  await page.keyboard.press('Tab')
  await expect(title).toBeFocused()
})

test('textos avulsos e conteúdo do rodapé entram na sequência de leitura', async ({ page }) => {
  const date = page.locator('.editorial-date').first()
  const articleTitle = page.locator('.editorial-card h3').first()
  await expect(date).toHaveAttribute('tabindex', '0')
  await date.focus()
  await page.keyboard.press('Tab')
  await expect(articleTitle).toBeFocused()

  const feature = page.getByRole('contentinfo').locator('.footer-feature').first()
  const title = feature.getByRole('heading')
  await expect(title).toHaveAttribute('tabindex', '0')
  await title.focus()
  await page.keyboard.press('Tab')
  await expect(feature.locator('p')).toBeFocused()

  const card = page.getByLabel('Catálogo', { exact: true }).getByRole('link').first()
  await expect(card).toHaveAccessibleName(/Emerald Ape #042.*ETH/)
  await expect(card.getByRole('img')).toHaveAttribute('alt', /Retrato/)
})

test('valores do carrinho são acessíveis sem alterar os controles', async ({ page, isMobile }) => {
  await api(page, 'POST', '/cart/items', { nftId: 'nft-001', quantity: 1 })
  await page.goto('/cart')
  const price = page.locator('.cart-unit-price').first()
  const quantity = page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042' })
  if (isMobile) {
    await expect(price).not.toBeVisible()
    await expect(price).not.toHaveAttribute('tabindex')
    await quantity.focus()
  } else {
    await expect(price).toHaveAttribute('tabindex', '0')
    await price.focus()
    await page.keyboard.press('Tab')
  }
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042' })
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Aumentar Quantidade de Emerald Ape #042' })
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('.cart-line-total').first()).toBeFocused()
})

test('diálogo inclui título e texto no Tab, contém o foco e o restaura ao fechar', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: /Ler mais.*Raridade/ })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Raridade, atributos e procedência' })
  const title = dialog.getByRole('heading')
  const finish = dialog.getByRole('button', { name: 'Fechar leitura', exact: true })
  const close = dialog.getByRole('button', { name: 'Fechar artigo', exact: true })

  await expect(title).toBeFocused()
  await expect(title).toHaveAttribute('tabindex', '0')
  await expect(page.getByText('Bem-vindo à Kurio', { exact: true })).not.toHaveAttribute('tabindex')
  await page.keyboard.press('Tab')
  await expect(dialog.locator('p')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(finish).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(finish).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(page.getByText('Bem-vindo à Kurio', { exact: true })).toHaveAttribute(
    'tabindex',
    '0'
  )
})

test('login mantém o foco inicial no e-mail e permite voltar ao texto de apresentação', async ({
  page,
  isMobile,
}) => {
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  const email = dialog.getByLabel('E-mail', { exact: true })
  const introduction = isMobile
    ? dialog.getByRole('heading', { level: 1 })
    : dialog.locator('#auth-description')
  await expect(email).toBeFocused()
  await expect(introduction).toHaveAttribute('tabindex', '0')
  await page.keyboard.press('Shift+Tab')
  await expect(introduction).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(email).toBeFocused()
  await expect(dialog.getByRole('button', { name: /^Leitura por Tab/ })).toHaveCount(0)
})

test('conteúdo dinâmico entra na leitura quando aparece', async ({ page }) => {
  await page.goto('/login')
  const trigger = page.getByRole('button', { name: 'Esqueceu a senha?' })
  const explanation = page.locator('#auth-recovery')
  await trigger.click()
  await expect(explanation).toHaveAttribute('tabindex', '0')
  await page.keyboard.press('Tab')
  await expect(explanation).toBeFocused()
  await trigger.click()
  await expect(explanation).toHaveCount(0)
})

test('foco continua visível em viewport equivalente a zoom elevado', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 })
  const hero = page.getByRole('region', { name: 'Destaques da Kurio' })
  const welcome = hero.getByText('Bem-vindo à Kurio', { exact: true })
  const title = hero.getByRole('heading', { level: 1 })
  await expect(welcome).toHaveAttribute('tabindex', '0')
  await welcome.focus()
  await page.keyboard.press('Tab')
  await expect(title).toBeFocused()
  expect(await title.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  const bounds = (await title.boundingBox())!
  expect(bounds.y).toBeLessThan(256)
  expect(bounds.y + bounds.height).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
})
