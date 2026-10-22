import { expect, test } from '@playwright/test'
import { api, loginApi, orderInput, prepare } from './support/api.js'

test.beforeEach(async ({ page }) => prepare(page))

test('cadastro, conflito, sessão, logout e expiração', async ({ page }) => {
  expect((await api(page, 'POST', '/auth/register', { name: 'A', email: 'x', password: '123' })).status).toBe(422)
  const input = { name: 'Nova Colecionadora', email: 'nova@example.test', password: 'senha1234' }
  const registered = await api<{ session: { token: string } }>(page, 'POST', '/auth/register', input)
  expect(registered.status).toBe(201)
  expect((await api(page, 'POST', '/auth/register', input)).code).toBe('CONFLICT')
  const token = registered.data!.session.token
  expect((await api(page, 'GET', '/auth/session', undefined, token)).status).toBe(200)
  expect((await api(page, 'POST', '/auth/logout', undefined, token)).status).toBe(204)
  expect((await api(page, 'GET', '/auth/session', undefined, token)).code).toBe('SESSION_EXPIRED')
  const session = await loginApi(page)
  await api(page, 'POST', '/auth/expire', undefined, session.session.token)
  expect((await api(page, 'GET', '/profile', undefined, session.session.token)).code).toBe('SESSION_EXPIRED')
  expect((await api(page, 'GET', '/wallets', undefined, null)).status).toBe(401)
})

test('catálogo filtra, ordena, pagina e valida parâmetros e recursos inexistentes', async ({ page }) => {
  const result = await api<{ items: { network: string; priceEth: string }[]; total: number }>(page, 'GET', '/nfts?network=ethereum&sort=price-asc&pageSize=2&page=2&minPrice=0.1&maxPrice=12.3')
  expect(result.status).toBe(200)
  expect(result.data!.items).toHaveLength(2)
  expect(result.data!.items.every((item) => item.network === 'ethereum')).toBeTruthy()
  expect(Number(result.data!.items[0].priceEth)).toBeLessThanOrEqual(Number(result.data!.items[1].priceEth))
  expect((await api<{ items: unknown[] }>(page, 'GET', '/nfts?search=inexistente')).data!.items).toHaveLength(0)
  expect((await api(page, 'GET', '/nfts?sort=invalido')).status).toBe(422)
  expect((await api(page, 'GET', '/nfts?page=1.5')).status).toBe(422)
  expect((await api(page, 'GET', '/nfts/nft-ausente')).status).toBe(404)
  expect((await api(page, 'GET', '/recurso-inexistente')).status).toBe(404)
})

test('favoritos são idempotentes e isolados por usuário', async ({ page }) => {
  const ana = (await loginApi(page)).session.token
  const bruno = (await loginApi(page, 'bruno')).session.token
  await api(page, 'POST', '/favorites', { nftId: 'nft-002' }, ana)
  await api(page, 'POST', '/favorites', { nftId: 'nft-002' }, ana)
  const list = await api<{ items: { id: string }[] }>(page, 'GET', '/favorites', undefined, ana)
  expect(list.data!.items.filter((item) => item.id === 'nft-002')).toHaveLength(1)
  expect((await api<{ items: unknown[] }>(page, 'GET', '/favorites', undefined, bruno)).data!.items).toHaveLength(0)
  await api(page, 'DELETE', '/favorites/nft-002', undefined, ana)
  expect((await api<{ items: { id: string }[] }>(page, 'GET', '/favorites', undefined, ana)).data!.items.some((item) => item.id === 'nft-002')).toBeFalsy()
})

test('carrinho visitante sobrevive ao login e quantidades inválidas não alteram estado', async ({ page }) => {
  const token = (await loginApi(page)).session.token
  const order = await orderInput(page, token)
  const nftId = order.items[0].nftId
  expect((await api(page, 'POST', '/cart/items', { nftId, quantity: 1 }, null)).status).toBe(201)
  expect((await api(page, 'PATCH', `/cart/items/${nftId}`, { quantity: 1.5 }, null)).status).toBe(422)
  expect((await api(page, 'PATCH', `/cart/items/${nftId}`, { quantity: 999 }, null)).status).toBe(409)
  await loginApi(page)
  const cart = await api<{ items: { quantity: number }[] }>(page, 'GET', '/cart', undefined, token)
  expect(cart.data!.items[0].quantity).toBe(1)
  await page.reload()
  expect((await api<{ items: unknown[] }>(page, 'GET', '/cart', undefined, token)).data!.items).toHaveLength(1)
  await api(page, 'DELETE', `/cart/items/${nftId}`, undefined, token)
  expect((await api<{ items: unknown[] }>(page, 'GET', '/cart', undefined, token)).data!.items).toHaveLength(0)
})

test('perfil, senha e carteiras validam e persistem mudanças sem expor outros usuários', async ({ page }) => {
  const token = (await loginApi(page)).session.token
  const profile = await api<{ name: string }>(page, 'PATCH', '/profile', { name: 'Ana Atualizada', avatarUrl: 'https://example.test/avatar.png' }, token)
  expect(profile.data!.name).toBe('Ana Atualizada')
  expect((await api(page, 'PATCH', '/profile', { avatarUrl: 'javascript:alert(1)' }, token)).status).toBe(422)
  expect((await api(page, 'PUT', '/profile/password', { currentPassword: 'errada', newPassword: 'nova12345' }, token)).status).toBe(422)
  expect((await api(page, 'PUT', '/profile/password', { currentPassword: 'kurio1234', newPassword: 'nova12345' }, token)).status).toBe(204)
  expect((await api(page, 'POST', '/auth/login', { email: 'ana.ribeiro@kurio.dev', password: 'kurio1234' })).status).toBe(401)
  expect((await api(page, 'POST', '/auth/login', { email: 'ana.ribeiro@kurio.dev', password: 'nova12345' })).status).toBe(200)
  expect((await api(page, 'POST', '/wallets', { label: 'Inválida', address: 'xyz', network: 'ethereum' }, token)).status).toBe(422)
  const wallet = await api<{ id: string }>(page, 'POST', '/wallets', { label: 'Secundária', address: `0x${'a'.repeat(40)}`, network: 'ethereum', isPrimary: true }, token)
  expect(wallet.status).toBe(201)
  await api(page, 'PATCH', `/wallets/${wallet.data!.id}`, { label: 'Reserva' }, token)
  const list = await api<{ items: { isPrimary: boolean; label: string }[] }>(page, 'GET', '/wallets', undefined, token)
  expect(list.data!.items.filter((item) => item.isPrimary)).toHaveLength(1)
  expect(list.data!.items.some((item) => item.label === 'Reserva')).toBeTruthy()
  await page.reload()
  expect((await api<{ name: string }>(page, 'GET', '/profile', undefined, token)).data!.name).toBe('Ana Atualizada')
})

test('cotação valida cupom, duplicatas, disponibilidade e precisão decimal', async ({ page }) => {
  const token = (await loginApi(page)).session.token
  const input = await orderInput(page, token)
  await api(page, 'PATCH', `/__mocks/nfts/${input.items[0].nftId}`, { priceEth: '0.123456789123456789' })
  const result = await api<{ subtotalEth: string; totalEth: string }>(page, 'POST', '/quote', { items: input.items }, token)
  expect(result.data!.subtotalEth).toBe('0.123456789123456789')
  expect(result.data!.totalEth).toBe('0.124656789123456789')
  expect((await api(page, 'POST', '/quote', { items: input.items, couponCode: 'KURIO10' }, token)).status).toBe(200)
  expect((await api(page, 'POST', '/quote', { items: input.items, couponCode: 'INVÁLIDO' }, token)).code).toBe('COUPON_INVALID')
  expect((await api(page, 'POST', '/quote', { items: input.items, couponCode: 'EXPIRADO10' }, token)).code).toBe('COUPON_EXPIRED')
  expect((await api(page, 'POST', '/quote', { items: [...input.items, ...input.items] }, token)).status).toBe(422)
  expect((await api(page, 'POST', '/quote', { items: [{ ...input.items[0], quantity: 999 }] }, token)).code).toBe('AVAILABILITY_CONFLICT')
})

test('pedidos simultâneos são idempotentes e chaves iguais pertencem a usuários diferentes', async ({ page }) => {
  const ana = (await loginApi(page)).session.token
  const bruno = (await loginApi(page, 'bruno')).session.token
  const input = await orderInput(page, ana)
  const results = await Promise.all([api<{ id: string }>(page, 'POST', '/orders', input, ana), api<{ id: string }>(page, 'POST', '/orders', input, ana)])
  expect(results[0].data!.id).toBe(results[1].data!.id)
  const conflict = await api(page, 'POST', '/orders', { ...input, collector: { ...input.collector, name: 'Outro nome' } }, ana)
  expect(conflict.code).toBe('IDEMPOTENCY_CONFLICT')
  expect((await api(page, 'GET', `/orders/${results[0].data!.id}`, undefined, bruno)).status).toBe(403)
  const second = await orderInput(page, bruno, 'polygon')
  expect((await api(page, 'POST', '/orders', second, bruno)).status).toBe(201)
  expect((await api<{ items: unknown[] }>(page, 'GET', '/orders', undefined, ana)).data!.items).toHaveLength(1)
})

test('timeout após persistência recupera o mesmo pedido sem nova baixa de estoque', async ({ page }) => {
  const token = (await loginApi(page)).session.token
  const input = await orderInput(page, token)
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'order-timeout' })
  expect((await api(page, 'POST', '/orders', input, token)).code).toBe('GATEWAY_TIMEOUT')
  const recovered = await api<{ id: string; status: string }>(page, 'POST', '/orders', input, token)
  expect(recovered.status).toBe(200)
  expect(recovered.data!.status).toBe('confirmed')
  expect((await api<{ items: unknown[] }>(page, 'GET', '/orders', undefined, token)).data!.items).toHaveLength(1)
  const replay = await api<{ id: string }>(page, 'POST', '/orders', input, token)
  expect(replay.data!.id).toBe(recovered.data!.id)
})

test('cotação alterada bloqueia compra e pedidos pendentes só têm uma transição terminal', async ({ page }) => {
  const token = (await loginApi(page)).session.token
  const input = await orderInput(page, token)
  await api(page, 'PATCH', `/__mocks/nfts/${input.items[0].nftId}`, { priceEth: '0.2' })
  expect((await api(page, 'POST', '/orders', input, token)).code).toBe('QUOTE_STALE')
  const updated = await orderInput(page, token)
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'payment-pending' })
  const order = await api<{ id: string; status: string }>(page, 'POST', '/orders', updated, token)
  expect(order.data!.status).toBe('pending')
  await api(page, 'POST', `/__mocks/orders/${order.data!.id}/settle`, { status: 'confirmed' })
  const terminal = await api<{ status: string }>(page, 'POST', `/__mocks/orders/${order.data!.id}/settle`, { status: 'declined' })
  expect(terminal.data!.status).toBe('confirmed')
})

test('falhas transitórias, pagamento recusado e reset são reproduzíveis', async ({ page }) => {
  const token = (await loginApi(page)).session.token
  const input = await orderInput(page, token)
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'payment-declined' })
  const result = await api<{ status: string }>(page, 'POST', '/orders', input, token)
  expect(result.data!.status).toBe('declined')
  await api(page, 'PUT', '/__mocks/scenario', { scenario: 'server-error' })
  expect((await api(page, 'GET', '/nfts')).status).toBe(503)
  await api(page, 'POST', '/__mocks/reset')
  expect((await api(page, 'GET', '/nfts')).status).toBe(200)
  expect((await api(page, 'GET', '/auth/session', undefined, token)).status).toBe(401)
})
