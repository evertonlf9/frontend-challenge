import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

let server, money, contracts, createSeedState, createCheckout, quoteFingerprint, authSearch, errors, shouldRetryQuery, networkReady
before(async () => {
  server = await createServer({ mode: 'mock', server: { middlewareMode: true }, appType: 'custom' })
  const load = (path) => server.ssrLoadModule('/src/' + path)
  const modules = await Promise.all([
    load('lib/money.ts'), load('infrastructure/api/response-contracts.ts'), load('mocks/db/fixtures.ts'),
    load('mocks/application/checkout.ts'), load('modules/checkout/application/quote-review.ts'),
    load('modules/auth/application/auth-navigation.ts'), load('lib/api-error.ts'), load('lib/query-client.ts'), load('network-ready.ts'),
  ])
  ;[money, contracts, { createSeedState }, { createCheckout }, { quoteFingerprint }, { authSearch }, errors, { shouldRetryQuery }, networkReady] = modules
})
after(async () => { await server?.close() })

function checkoutFixture(scenario = 'default') {
  let state = createSeedState()
  state.scenario = scenario
  let sequence = 0
  let now = Date.parse('2026-10-21T12:00:00.000Z')
  const checkout = createCheckout({
    read: () => state, now: () => now, id: (prefix) => `${prefix}_${++sequence}`,
    transaction: (operation) => {
      const previous = structuredClone(state)
      try { return structuredClone(operation(state)) } catch (error) { state = previous; throw error }
    },
  })
  const owner = 'user-ana'
  const items = [{ nftId: 'nft-001', quantity: 1 }]
  state.carts[owner] = [{ nftId: 'nft-001', quantity: 2 }]
  const quote = checkout.quote(owner, { items })
  const input = { quoteId: quote.id, items, couponCode: null, walletId: 'wallet-ana-primary', network: 'ethereum', collector: { name: 'Colecionador', email: 'colecionador@example.test' } }
  return { checkout, owner, quote, input, state: () => state, advance: (duration) => { now += duration } }
}

test('ETH mantém precisão de 18 casas e valores além do inteiro seguro de Number', () => {
  assert.equal(money.addEth('0.1', '0.2'), '0.3')
  assert.equal(money.addEth('9007199254740993', '0.000000000000000001'), '9007199254740993.000000000000000001')
  assert.equal(money.mulEth('0.123456789123456789', 3), '0.370370367370370367')
  assert.equal(money.compareEth('0.123456789123456788', '0.123456789123456789'), -1)
  assert.equal(money.subEth('1', '0.999999999999999999'), '0.000000000000000001')
})
for (const value of ['NaN', '1e-3', '0.0000000000000000001', '', 'Infinity']) {
  test(`ETH rejeita formato inválido: ${JSON.stringify(value)}`, () => assert.throws(() => money.addEth(value)))
}
test('cotação calcula quantidade, desconto e taxa sem arredondamento binário', () => {
  const { checkout, owner } = checkoutFixture()
  const quote = checkout.quote(owner, { items: [{ nftId: 'nft-001', quantity: 3 }], couponCode: 'KURIO10' })
  assert.equal(quote.subtotalEth, '3.57')
  assert.equal(quote.discountEth, '0.357')
  assert.equal(quote.totalEth, '3.2166')
  assert.doesNotThrow(() => contracts.quoteResponse(quote))
})
test('replay após expiração recupera o mesmo pedido sem baixar estoque novamente', () => {
  const fixture = checkoutFixture()
  const before = fixture.state().nfts[0].available
  const first = fixture.checkout.create(fixture.owner, fixture.input, 'unit-attempt-0001')
  fixture.advance(6 * 60_000)
  const replay = fixture.checkout.create(fixture.owner, fixture.input, 'unit-attempt-0001')
  assert.equal(replay.order.id, first.order.id)
  assert.equal(replay.replay, true)
  assert.equal(fixture.state().nfts[0].available, before - 1)
  assert.equal(fixture.state().orders.length, 1)
  assert.equal(fixture.state().carts[fixture.owner][0].quantity, 1)
})
test('chave reutilizada com outro payload gera conflito e não cria pedido', () => {
  const fixture = checkoutFixture()
  fixture.checkout.create(fixture.owner, fixture.input, 'unit-attempt-0002')
  assert.throws(() => fixture.checkout.create(fixture.owner, { ...fixture.input, collector: { ...fixture.input.collector, name: 'Outro nome' } }, 'unit-attempt-0002'), { code: 'IDEMPOTENCY_CONFLICT' })
  assert.equal(fixture.state().orders.length, 1)
})
test('falta de estoque ao encerrar pedido pendente recusa compra e preserva carrinho', () => {
  const fixture = checkoutFixture('payment-pending')
  const { order } = fixture.checkout.create(fixture.owner, fixture.input, 'unit-attempt-0003')
  fixture.state().nfts[0].available = 0
  const settled = fixture.checkout.settle(fixture.owner, order.id, 'confirmed')
  assert.equal(settled.status, 'declined')
  assert.equal(fixture.state().carts[fixture.owner][0].quantity, 2)
  assert.equal(fixture.checkout.settle(fixture.owner, order.id, 'confirmed').status, 'declined')
})
test('snapshot confirmado não muda com catálogo e não é acessível a outro usuário', () => {
  const fixture = checkoutFixture()
  const { order } = fixture.checkout.create(fixture.owner, fixture.input, 'unit-attempt-0004')
  fixture.state().nfts[0].priceEth = '100'
  assert.equal(fixture.checkout.get(fixture.owner, order.id).totalEth, order.totalEth)
  assert.equal(fixture.checkout.settle(fixture.owner, order.id, 'declined').status, 'confirmed')
  assert.throws(() => fixture.checkout.get('user-bruno', order.id), { code: 'FORBIDDEN' })
})
test('revisão ignora IDs e datas, mas detecta preço ou disponibilidade alterados', () => {
  const { quote } = checkoutFixture()
  assert.equal(quoteFingerprint(quote), quoteFingerprint({ ...quote, id: 'another', expiresAt: '2099-01-01T00:00:00Z' }))
  assert.notEqual(quoteFingerprint(quote), quoteFingerprint({ ...quote, totalEth: '9' }))
  assert.notEqual(quoteFingerprint(quote), quoteFingerprint({ ...quote, availability: [] }))
})
for (const [description, change] of [
  ['preço como número', (nft) => { nft.priceEth = 0.1 }],
  ['quantidade fracionária', (nft) => { nft.available = 1.5 }],
  ['rede desconhecida', (nft) => { nft.network = 'unknown' }],
  ['data inválida', (nft) => { nft.updatedAt = 'not-a-date' }],
  ['imagem com protocolo executável', (nft) => { nft.imageUrl = 'javascript:alert(1)' }],
  ['URL com credenciais', (nft) => { nft.imageUrl = 'https://user:password@example.test/image.png' }],
  ['caminho convertido em outra origem', (nft) => { nft.imageUrl = '/\\example.test/image.png' }],
  ['objeto aninhado ausente', (nft) => { delete nft.creator }],
]) {
  test(`borda HTTP rejeita ${description}`, () => {
    const nft = structuredClone(createSeedState().nfts[0])
    change(nft)
    assert.throws(() => contracts.nftResponse(nft), { code: 'INVALID_RESPONSE' })
  })
}
test('borda HTTP rejeita total incoerente e estado desconhecido de pedido', () => {
  const fixture = checkoutFixture()
  assert.throws(() => contracts.quoteResponse({ ...fixture.quote, totalEth: '999' }), { code: 'INVALID_RESPONSE' })
  const { order } = fixture.checkout.create(fixture.owner, fixture.input, 'unit-attempt-0005')
  assert.doesNotThrow(() => contracts.orderResponse(order))
  assert.throws(() => contracts.orderResponse({ ...order, status: 'paid' }), { code: 'INVALID_RESPONSE' })
})
test('eventos exigem identidade e versão compatíveis com o payload', () => {
  const nft = createSeedState().nfts[0]
  const event = { id: 'event-1', type: 'nft.updated', resourceId: nft.id, version: nft.version, data: nft }
  assert.equal(contracts.marketplaceEvent(event).data.id, nft.id)
  assert.throws(() => contracts.marketplaceEvent({ ...event, resourceId: 'other-nft' }), { code: 'INVALID_RESPONSE' })
  assert.throws(() => contracts.marketplaceEvent({ ...event, version: nft.version + 1 }), { code: 'INVALID_RESPONSE' })
})
test('falhas de contrato não repetem consultas e erros malformados não quebram formulários', () => {
  const error = new errors.ApiError({ code: 'INVALID_RESPONSE' }, 502)
  assert.equal(shouldRetryQuery(0, error), false)
  const parsed = errors.parseApiError({ isAxiosError: true, response: { status: 422, data: { error: { code: 'VALIDATION_ERROR', details: [null, 'invalid', { field: 'name', message: 'Obrigatório' }] } } } })
  assert.equal(parsed.fieldMessage('name'), 'Obrigatório')
  assert.equal(parsed.details.length, 1)
  assert.equal(errors.parseApiError({ isAxiosError: true, response: { status: 500, data: { error: { code: 'untrusted-code' } } } }).code, 'UNKNOWN')
})
for (const redirect of ['//example.com', '/\\example.com', 'javascript:alert(1)', '/login', '/checkout\n']) {
  test(`retorno de autenticação bloqueia ${JSON.stringify(redirect)}`, () => assert.deepEqual(authSearch({ redirect }), {}))
}
test('retorno de autenticação preserva caminho interno e parâmetros', () => {
  assert.deepEqual(authSearch({ redirect: '/checkout?coupon=KURIO10' }), { redirect: '/checkout?coupon=KURIO10' })
})

test('transporte só é liberado quando a interceptação de rede fica pronta', async () => {
  let release
  networkReady.setNetworkReady(new Promise(resolve => { release = resolve }))
  let dispatched = false
  const pending = networkReady.waitForNetwork().then(() => { dispatched = true })
  await Promise.resolve()
  assert.equal(dispatched, false)
  release()
  await pending
  assert.equal(dispatched, true)
  networkReady.setNetworkReady(Promise.resolve())
})
