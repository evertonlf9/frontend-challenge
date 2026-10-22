import { expect, test } from '@playwright/test'
import { prepare } from './support/api.js'

test.beforeEach(async ({ page }) => prepare(page))

for (const hash of ['', '#catalogo']) {
  test('abas, preço e ordenação preservam scroll ' + (hash || 'sem âncora'), async ({ page }) => {
    await page.goto('/' + hash)
    const catalog = page.getByLabel('Catálogo', { exact: true })
    await expect(catalog.getByRole('link')).toHaveCount(9)
    const initialNames = await catalog.getByRole('heading').allTextContents()
    for (const [label, view] of [['Novos lançamentos', 'new'], ['Em alta', 'trending'], ['Todos os NFTs', 'all']] as const) {
      const button = page.getByRole('button', { name: label, exact: true })
      await button.scrollIntoViewIfNeeded()
      const before = await page.evaluate(() => window.scrollY)
      const response = view === 'all' ? null : page.waitForResponse((value) => value.url().includes('/api/nfts?') && new URL(value.url()).searchParams.get('view') === view)
      await button.click()
      if (response) {
        const payload = await (await response).json() as { items: { name: string }[] }
        await expect(catalog.getByRole('heading')).toHaveText(payload.items.map((item) => item.name))
      } else await expect(catalog.getByRole('heading')).toHaveText(initialNames)
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(Math.abs(await page.evaluate(() => window.scrollY) - before)).toBeLessThanOrEqual(2)
    }
    const apply = page.getByRole('button', { name: 'Aplicar', exact: true })
    await apply.scrollIntoViewIfNeeded()
    const beforeApply = await page.evaluate(() => window.scrollY)
    const priced = page.waitForResponse((value) => value.url().includes('/api/nfts?') && new URL(value.url()).searchParams.has('minPrice'))
    await apply.click()
    await priced
    await expect(page).toHaveURL(/minPrice/)
    expect(Math.abs(await page.evaluate(() => window.scrollY) - beforeApply)).toBeLessThanOrEqual(2)
    await expect(apply).toBeFocused()
    const sort = page.getByRole('combobox', { name: 'Ordenar por', exact: true })
    await sort.scrollIntoViewIfNeeded()
    const beforeSort = await page.evaluate(() => window.scrollY)
    const sorted = page.waitForResponse((value) => value.url().includes('/api/nfts?') && new URL(value.url()).searchParams.get('sort') === 'price-asc')
    await sort.selectOption('price-asc')
    await sorted
    await expect(page).toHaveURL(/sort=price-asc/)
    expect(Math.abs(await page.evaluate(() => window.scrollY) - beforeSort)).toBeLessThanOrEqual(2)
  })
}
