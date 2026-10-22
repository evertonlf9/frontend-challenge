import { expect, test } from '@playwright/test'
import { prepare } from './support/api.js'

test('inicializa a aplicação através do Router e recupera o catálogo no refresh', async ({ page }) => {
  await prepare(page)
  await page.reload()
  await expect(page.getByLabel('Catálogo').getByRole('link')).toHaveCount(9)
})

test('intercepta REST e Socket.IO com MSW', async ({ page }) => {
  await prepare(page)
  const health = await page.evaluate(async () => {
    // O servidor Vite permite carregar os módulos de infraestrutura pelo navegador.
    // @ts-expect-error Import de desenvolvimento resolvido pelo Vite.
    const { http } = await import('/src/lib/http.ts')
    return (await http.get('/health')).data
  })
  expect(health).toEqual({ status: 'ok' })

  const socketHealth = await page.evaluate(async () => {
    // @ts-expect-error Import de desenvolvimento resolvido pelo Vite.
    const { socket } = await import('/src/lib/socket.ts')
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.disconnect()
        reject(new Error('Socket.IO não respondeu'))
      }, 5_000)
      if (socket.connected) socket.emit('health.check')
      else socket.once('connect', () => socket.emit('health.check'))
      socket.once('connect_error', (error: Error) => {
        clearTimeout(timer)
        socket.disconnect()
        reject(error)
      })
      socket.once('health.ok', (data: unknown) => {
        clearTimeout(timer)
        socket.disconnect()
        resolve(data)
      })
      socket.connect()
    })
  })
  expect(socketHealth).toEqual({ status: 'ok' })
})
