import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
const server = await createServer({ mode: 'development', server: { host: 'localhost', port: 4175, strictPort: true } })
let browser
try {
  await server.listen()
  browser = await chromium.launch()
  const page = await browser.newPage()
  let loginStatus = null
  page.on('response', (response) => { if (response.url().endsWith('/api/auth/login')) loginStatus = response.status() })
  await page.goto('http://localhost:4175/login')
  await page.getByLabel('E-mail', { exact: true }).fill('ana.ribeiro@kurio.dev')
  await page.getByLabel('Senha', { exact: true }).fill('kurio1234')
  await page.getByRole('button', { name: 'Entrar na conta' }).click()
  await page.getByRole('button', { name: 'Sair', exact: true }).waitFor()
  if (loginStatus !== 200) throw new Error('O login no modo padrão não respondeu 200.')
  const result = { mode: 'development', loginStatus, authenticated: true }
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/default-mode.json', JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
} finally { await browser?.close(); await server.close() }
