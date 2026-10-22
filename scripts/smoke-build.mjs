import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { preview } from 'vite'
import { chromium, expect } from '@playwright/test'

export async function verifyBuild(port = 4176) {
  const server = await preview({ preview: { host: 'localhost', port, strictPort: true } })
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    const documentResponse = await page.goto(`http://localhost:${port}/`)
    const htmlSha256 = createHash('sha256').update(await documentResponse.body()).digest('hex')
    const entry = await page.locator('script[type="module"]').getAttribute('src')
    const asset = await page.request.get(`http://localhost:${port}${entry}`, { headers: { 'Accept-Encoding': 'br' } })
    expect(asset.headers()['content-encoding']).toBe('br')
    expect(asset.headers()['cache-control']).toContain('immutable')
    const uncompressed = await page.request.get(`http://localhost:${port}${entry}`, { headers: { 'Accept-Encoding': 'identity' } })
    expect(await asset.body()).toEqual(await uncompressed.body())
    const refused = await page.request.get(`http://localhost:${port}${entry}`, { headers: { 'Accept-Encoding': 'br;q=0, identity' } })
    expect(refused.headers()['content-encoding']).not.toBe('br')
    expect(refused.headers()['vary']).toContain('Accept-Encoding')
    expect(await refused.body()).toEqual(await uncompressed.body())
    await expect(page.getByRole('heading', { name: /SEJA DONO DO FUTURO/ })).toBeVisible()
    await expect(page.getByLabel('Catálogo', { exact: true }).getByRole('link')).toHaveCount(9)
    await page.goto(`http://localhost:${port}/nft/nft-001`)
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
    await page.evaluate(async () => {
      const result = await fetch('/api/__mocks/nfts/nft-001', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceEth: '0.2' }) })
      if (!result.ok) throw new Error('Controle MSW indisponível no build.')
    })
    await expect(page.locator('.detail-price')).toContainText('0.2 ETH')
    await page.goto(`http://localhost:${port}/login`)
    await page.getByLabel('E-mail', { exact: true }).fill('ana.ribeiro@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('kurio1234')
    await page.getByRole('button', { name: 'Entrar na conta' }).click()
    await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
    await page.goto(`http://localhost:${port}/nft/nft-001`)
    await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
    await page.getByRole('link', { name: /Continuar para pagamento/ }).click()
    await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
    await expect(page.getByText(/Carteira conectada à rede/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
    await page.getByRole('button', { name: 'Confirmar compra simulada', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
    await page.evaluate(() => localStorage.setItem('kurio.accessibility.reading-mode', 'true'))
    await page.goto(`http://localhost:${port}/nft/nft-002`)
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.locator('main h1')).toHaveAttribute('data-reading-focus', '')
    await page.goto(`http://localhost:${port}/nft/not-found`)
    await expect(page.getByRole('alert')).toBeVisible()
    expect(errors).toEqual([])
    await mkdir('test-results', { recursive: true })
    const result = { completedAt: new Date().toISOString(), build: 'production', entry, htmlSha256, chromium: browser.version(), brotli: true, catalog: true, directRoutes: true, realtime: true, login: true, checkout: true, receiptAfterReload: true, pageErrors: errors.length }
    await writeFile('test-results/production-build.json', JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result))
    return result
  } finally {
    await browser?.close()
    await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
  }
}

// Keep the same real-flow preflight available to the Lighthouse runner.
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/smoke-build.mjs')) await verifyBuild()
