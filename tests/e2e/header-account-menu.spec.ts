import { expect, test } from '@playwright/test'
import { loginUi, prepare } from './support/api.js'

test.beforeEach(async ({ page }) => {
  await prepare(page)
  await loginUi(page)
  await page.goto('/profile')
  await expect(page.getByRole('form', { name: 'Perfil do colecionador' })).toBeVisible()
})

const destinations = [
  { label: 'Meu perfil', pathname: '/profile' },
  { label: 'Carteiras', pathname: '/wallets' },
  { label: 'Meus pedidos', pathname: '/confirmation' },
]

for (const { label, pathname } of destinations) {
  test(`menu da conta fecha ao selecionar ${label}, inclusive na página atual`, async ({
    page,
  }) => {
    const menu = page.locator('header details.account-menu')
    const trigger = menu.locator('summary')
    const link = menu.getByRole('link', { name: label, exact: true })

    for (let selection = 0; selection < 2; selection++) {
      await trigger.click()
      await expect(link).toBeVisible()
      await link.click()

      await expect(page).toHaveURL((url) => url.pathname === pathname)
      await expect(menu).not.toHaveAttribute('open')
      await expect(link).not.toBeVisible()
    }
  })
}

test('menu da conta fecha ao clicar fora e permite abrir novamente', async ({ page }) => {
  const menu = page.locator('header details.account-menu')
  const trigger = menu.locator('summary')
  const link = menu.getByRole('link', { name: 'Carteiras', exact: true })

  await trigger.click()
  await expect(link).toBeVisible()
  await page
    .getByRole('form', { name: 'Perfil do colecionador' })
    .getByLabel('E-mail', { exact: true })
    .click()
  await expect(menu).not.toHaveAttribute('open')

  await trigger.click()
  await expect(link).toBeVisible()
})

test('Escape fecha o menu e devolve o foco ao nome da conta', async ({ page }) => {
  const menu = page.locator('header details.account-menu')
  const trigger = menu.locator('summary')

  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(menu.getByRole('link', { name: 'Meu perfil', exact: true })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(menu.getByRole('link', { name: 'Meu perfil', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')

  await expect(menu).not.toHaveAttribute('open')
  await expect(trigger).toBeFocused()
})

test('Tab fecha o menu ao sair das opções sem prender o foco', async ({ page }) => {
  const menu = page.locator('header details.account-menu')
  await menu.locator('summary').click()
  await menu.getByRole('link', { name: 'Meus pedidos', exact: true }).focus()
  await page.keyboard.press('Tab')

  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeFocused()
  await expect(menu).not.toHaveAttribute('open')
})
