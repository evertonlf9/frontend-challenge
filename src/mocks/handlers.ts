import { clearSessionToken } from '@/lib/session-storage'
import { http, HttpResponse, delay } from 'msw'
import { ApiError } from '@/lib/api-error'
import { mockApi, publishOrder } from './api'
import { apiUrl } from './rest/endpoints'
import { applyLatency, applyScenarioEffects, catalogLatency, resetLatency } from './rest/guard'
import { getActiveScenario, getState, mutate, resetState, setScenario } from './db/state'
import { isMockScenario, SCENARIO_CATALOG } from './scenarios'
import { invalid, record, text } from './application/validation'
import { mockEvents, socketControls } from './events'

function token(request: Request) {
  return request.headers.get('Authorization')?.replace(/^Bearer /, '') || null
}
function user(request: Request) {
  return mockApi.accounts.authenticate(token(request)).user.id
}
function owner(request: Request) {
  if (token(request)) return user(request)
  return `guest:${text(request.headers.get('x-cart-id'), 'x-cart-id')}`
}
async function body(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return invalid('body', 'JSON inválido.')
  }
}
type Endpoint = (context: {
  request: Request
  params: Record<string, string | readonly string[] | undefined>
}) => Response | Promise<Response>
const respond =
  (action: Endpoint, controlled = false): Endpoint =>
  async (context) => {
    try {
      if (!controlled) {
        const blocked = await applyScenarioEffects()
        if (blocked) return blocked
        await applyLatency(context.request.url.includes('/nfts?') ? catalogLatency() : 0)
      }
      return await action(context)
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError({ code: 'UNKNOWN' }, 500)
      return HttpResponse.json(
        { error: { code: failure.code, message: failure.message, details: failure.details } },
        { status: failure.status || 500 }
      )
    }
  }
const json = HttpResponse.json

export const handlers = [
  http.get(`${apiUrl}/health`, () => json({ status: 'ok' })),
  http.post(
    `${apiUrl}/auth/register`,
    respond(async ({ request }) =>
      json(
        mockApi.accounts.register(
          await body(request),
          request.headers.get('x-cart-id') ?? undefined
        ),
        { status: 201 }
      )
    )
  ),
  http.post(
    `${apiUrl}/auth/login`,
    respond(async ({ request }) =>
      json(
        mockApi.accounts.login(await body(request), request.headers.get('x-cart-id') ?? undefined)
      )
    )
  ),
  http.get(
    `${apiUrl}/auth/session`,
    respond(({ request }) => json(mockApi.accounts.session(token(request))))
  ),
  http.post(
    `${apiUrl}/auth/logout`,
    respond(({ request }) => {
      mockApi.accounts.logout(token(request))
      return new HttpResponse(null, { status: 204 })
    })
  ),
  http.post(
    `${apiUrl}/auth/expire`,
    respond(({ request }) => {
      mockApi.accounts.expire(token(request))
      return new HttpResponse(null, { status: 204 })
    })
  ),
  http.get(
    `${apiUrl}/nfts`,
    respond(({ request }) => {
      const result = mockApi.catalog.list(new URL(request.url).searchParams)
      return json(
        getActiveScenario() === 'invalid-catalog-response'
          ? {
              ...result,
              items: result.items.map((item) => ({ ...item, priceEth: Number(item.priceEth) })),
            }
          : result
      )
    })
  ),
  http.get(
    `${apiUrl}/nfts/:id`,
    respond(({ params }) => json(mockApi.catalog.get(String(params.id))))
  ),
  http.get(
    `${apiUrl}/favorites`,
    respond(({ request }) => json(mockApi.favorites.get(user(request))))
  ),
  http.post(
    `${apiUrl}/favorites`,
    respond(async ({ request }) => {
      const id = user(request)
      return json(mockApi.favorites.set(id, text(record(await body(request)).nftId, 'nftId'), true))
    })
  ),
  http.delete(
    `${apiUrl}/favorites/:nftId`,
    respond(({ request, params }) =>
      json(mockApi.favorites.set(user(request), String(params.nftId), false))
    )
  ),
  http.get(
    `${apiUrl}/cart`,
    respond(({ request }) => json(mockApi.cart.get(owner(request))))
  ),
  http.post(
    `${apiUrl}/cart/items`,
    respond(async ({ request }) => {
      const id = owner(request)
      return json(mockApi.cart.save(id, await body(request)), { status: 201 })
    })
  ),
  http.patch(
    `${apiUrl}/cart/items/:nftId`,
    respond(async ({ request, params }) => {
      const id = owner(request)
      return json(mockApi.cart.save(id, await body(request), String(params.nftId)))
    })
  ),
  http.delete(
    `${apiUrl}/cart/items/:nftId`,
    respond(({ request, params }) =>
      json(mockApi.cart.remove(owner(request), String(params.nftId)))
    )
  ),
  http.post(
    `${apiUrl}/quote`,
    respond(async ({ request }) => {
      const id = owner(request)
      return json(mockApi.checkout.quote(id, await body(request)))
    })
  ),
  http.get(
    `${apiUrl}/orders`,
    respond(({ request }) => json(mockApi.checkout.list(user(request))))
  ),
  http.get(
    `${apiUrl}/orders/:id`,
    respond(({ request, params }) => json(mockApi.checkout.get(user(request), String(params.id))))
  ),
  http.post(
    `${apiUrl}/orders`,
    respond(async ({ request }) => {
      const id = user(request)
      const result = mockApi.checkout.create(
        id,
        await body(request),
        request.headers.get('Idempotency-Key')
      )
      if (!result.replay) publishOrder(result.order)
      if (result.timeout) await delay(16_000)
      if (!result.replay && getActiveScenario() === 'invalid-order-response')
        return json({ ...result.order, totalEth: 0 }, { status: 201 })
      return json(result.order, { status: result.replay ? 200 : 201 })
    })
  ),
  http.get(
    `${apiUrl}/profile`,
    respond(({ request }) => json(mockApi.accounts.profile(user(request))))
  ),
  http.patch(
    `${apiUrl}/profile`,
    respond(async ({ request }) => {
      const id = user(request)
      return json(mockApi.accounts.updateProfile(id, await body(request)))
    })
  ),
  http.put(
    `${apiUrl}/profile/password`,
    respond(async ({ request }) => {
      const id = user(request)
      mockApi.accounts.changePassword(id, token(request)!, await body(request))
      return new HttpResponse(null, { status: 204 })
    })
  ),
  http.get(
    `${apiUrl}/wallets`,
    respond(({ request }) => json(mockApi.accounts.wallets(user(request))))
  ),
  http.post(
    `${apiUrl}/wallets/:id/connect`,
    respond(async ({ request, params }) =>
      json(mockApi.accounts.connectWallet(user(request), String(params.id), await body(request)))
    )
  ),
  http.post(
    `${apiUrl}/wallets/:id/disconnect`,
    respond(({ request, params }) => {
      if (!mockApi.accounts.wallets(user(request)).items.some((item) => item.id === params.id))
        return new HttpResponse(null, { status: 404 })
      return new HttpResponse(null, { status: 204 })
    })
  ),
  http.post(
    `${apiUrl}/wallets`,
    respond(async ({ request }) => {
      const id = user(request)
      return json(mockApi.accounts.saveWallet(id, await body(request)), { status: 201 })
    })
  ),
  http.patch(
    `${apiUrl}/wallets/:id`,
    respond(async ({ request, params }) => {
      const id = user(request)
      return json(mockApi.accounts.saveWallet(id, await body(request), String(params.id)))
    })
  ),
  // Disponíveis somente quando o MSW está habilitado; nunca fazem parte do backend real.
  http.get(`${apiUrl}/__mocks/scenarios`, () =>
    json({ active: getActiveScenario(), items: SCENARIO_CATALOG })
  ),
  http.post(
    `${apiUrl}/__mocks/reset`,
    respond(() => {
      resetState()
      resetLatency()
      clearSessionToken()
      return json({ scenario: getActiveScenario() })
    }, true)
  ),
  http.put(
    `${apiUrl}/__mocks/scenario`,
    respond(async ({ request }) => {
      const scenario = record(await body(request)).scenario
      if (!isMockScenario(scenario)) invalid('scenario', 'Cenário inválido.')
      resetLatency()
      setScenario(scenario)
      return json({ scenario })
    }, true)
  ),
  http.patch(
    `${apiUrl}/__mocks/nfts/:id`,
    respond(async ({ request, params }) => {
      const values = record(await body(request))
      const current = mockApi.catalog.get(String(params.id))
      if (
        values.priceEth !== undefined &&
        (typeof values.priceEth !== 'string' || !/^\d+(\.\d{1,18})?$/.test(values.priceEth))
      )
        invalid('priceEth', 'Preço decimal inválido.')
      if (
        values.available !== undefined &&
        (!Number.isSafeInteger(values.available) || Number(values.available) < 0)
      )
        invalid('available', 'Estoque inválido.')
      const nft = mutate((state) => {
        const item = state.nfts.find((item) => item.id === current.id)!
        if (values.priceEth !== undefined) item.priceEth = values.priceEth as string
        if (values.available !== undefined) item.available = values.available as number
        item.version += 1
        item.updatedAt = new Date().toISOString()
        return item
      })
      mockEvents.publish({
        id: `nft:${nft.id}:${nft.version}`,
        type: 'nft.updated',
        resourceId: nft.id,
        version: nft.version,
        data: nft,
      })
      return json(nft)
    }, true)
  ),
  http.post(
    `${apiUrl}/__mocks/orders/:id/settle`,
    respond(async ({ request, params }) => {
      const status = record(await body(request)).status
      if (status !== 'confirmed' && status !== 'declined')
        invalid('status', 'Estado terminal inválido.')
      const id = String(params.id)
      const order = mockApi.checkout.settle(getState().orderOwners[id], id, status)
      publishOrder(order)
      return json(order)
    }, true)
  ),
  http.post(
    `${apiUrl}/__mocks/events/replay`,
    respond(async ({ request }) => {
      const values = record(await body(request))
      const resourceId = text(values.resourceId, 'resourceId')
      const version = Number(values.version)
      if (!Number.isSafeInteger(version) || version < 1) invalid('version', 'Versão inválida.')
      if (values.type === 'nft.updated') {
        const nft = mockApi.catalog.get(resourceId)
        mockEvents.publish({
          id: `nft:${resourceId}:${version}`,
          type: 'nft.updated',
          resourceId,
          version,
          data: {
            ...nft,
            version,
            ...(typeof values.priceEth === 'string' ? { priceEth: values.priceEth } : {}),
          },
        })
      } else if (values.type === 'order.updated') {
        const owner = getState().orderOwners[resourceId]
        const order = mockApi.checkout.get(owner, resourceId)
        mockEvents.publish({
          id: `order:${resourceId}:${version}`,
          type: 'order.updated',
          resourceId,
          userId: owner,
          version,
          data: {
            ...order,
            version,
            status: values.status === 'pending' ? 'pending' : order.status,
          },
        })
      } else invalid('type', 'Tipo de evento inválido.')
      return json({ sent: true })
    }, true)
  ),
  http.post(
    `${apiUrl}/__mocks/socket/disconnect`,
    respond(() => {
      socketControls.disconnect()
      return json({ disconnected: true })
    }, true)
  ),
  http.all(`${apiUrl}/*`, () =>
    json({ error: { code: 'NOT_FOUND', message: 'Endpoint não encontrado.' } }, { status: 404 })
  ),
]
