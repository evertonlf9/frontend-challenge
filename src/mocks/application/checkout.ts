import { addEth, mulEth, percentEth, subEth } from '@/lib/money'
import type { Quote, QuoteInput } from '@/modules/checkout/domain/quote.contracts'
import type { Order, OrderStatus } from '@/modules/orders/domain/order.contracts'
import type { MockStore } from '../domain/store'
import { couponCode, email, fail, invalid, lines, network, record, text } from './validation'

export function createCheckout(store: MockStore) {
  const price = (input: unknown): Omit<Quote, 'id' | 'issuedAt' | 'expiresAt'> => {
    const body = record(input)
    const requested = lines(body.items)
    const code = couponCode(body.couponCode)
    const state = store.read()
    if (state.scenario === 'availability-conflict') fail('AVAILABILITY_CONFLICT', 409)
    const items = requested.map((line) => {
      const nft = state.nfts.find((item) => item.id === line.nftId)
      if (!nft) fail('NOT_FOUND', 404)
      if (line.quantity > nft.available || line.quantity > nft.maxPerOrder) fail('AVAILABILITY_CONFLICT', 409)
      return { ...line, name: nft.name, network: nft.network, unitPriceEth: nft.priceEth, subtotalEth: mulEth(nft.priceEth, line.quantity) }
    })
    const coupon = code ? state.coupons.find((item) => item.code === code) ?? null : null
    if (code && (!coupon || state.scenario === 'coupon-invalid')) fail('COUPON_INVALID', 422)
    if (coupon && Date.parse(coupon.expiresAt) <= store.now()) fail('COUPON_EXPIRED', 422)
    const subtotalEth = addEth(...items.map((item) => item.subtotalEth))
    const discountEth = coupon ? percentEth(subtotalEth, coupon.percentOff) : '0'
    const networkFeeEth = mulEth('0.0012', items.reduce((sum, item) => sum + item.quantity, 0))
    return { items, coupon, couponCode: code, subtotalEth, discountEth, networkFeeEth, totalEth: addEth(subEth(subtotalEth, discountEth), networkFeeEth), availability: requested.map((line) => ({ nftId: line.nftId, requested: line.quantity, available: state.nfts.find((item) => item.id === line.nftId)!.available, status: 'ok' })) }
  }
  const list = (owner: string) => ({ items: structuredClone(store.read().orders.filter((item) => store.read().orderOwners[item.id] === owner)) })
  const get = (owner: string, id: string) => {
    const order = store.read().orders.find((item) => item.id === id)
    if (!order) fail('NOT_FOUND', 404)
    if (store.read().orderOwners[id] !== owner) fail('FORBIDDEN', 403)
    return structuredClone(order)
  }
  const settle = (owner: string, id: string, status: Exclude<OrderStatus, 'pending'>) => {
    const order = get(owner, id)
    if (order.status !== 'pending') return order
    return store.transaction((state) => {
      const current = state.orders.find((item) => item.id === id)!
      if (status === 'confirmed') {
        // Validação atômica também no encerramento de um pedido pendente.
        const insufficient = current.items.some((line) => (state.nfts.find((nft) => nft.id === line.nftId)?.available ?? 0) < line.quantity)
        if (insufficient) { current.status = "declined"; current.failureReason = "Estoque indisponível ao concluir o pedido."; current.version += 1; current.updatedAt = new Date(store.now()).toISOString(); return current }
        for (const line of current.items) {
          const nft = state.nfts.find((item) => item.id === line.nftId)!
          nft.available -= line.quantity
          nft.version += 1
          nft.updatedAt = new Date(store.now()).toISOString()
        }
        state.carts[owner] = (state.carts[owner] ?? []).flatMap((line) => {
          const purchased = current.items.find((item) => item.nftId === line.nftId)
          const remaining = line.quantity - (purchased?.quantity ?? 0)
          return remaining > 0 ? [{ nftId: line.nftId, quantity: remaining }] : []
        })
        current.transactionRef = `simulated:${id}`
        current.explorerUrl = null
      } else {
        current.failureReason = 'Pagamento recusado na simulação.'
      }
      current.status = status
      current.updatedAt = new Date(store.now()).toISOString()
      current.version += 1
      return current
    })
  }
  return {
    list, get, settle,
    quote(owner: string, input: unknown): Quote {
      const pricing = price(input)
      return store.transaction((state) => {
        const quote: Quote = { ...pricing, id: store.id('quote'), issuedAt: new Date(store.now()).toISOString(), expiresAt: new Date(store.now() + 5 * 60_000).toISOString() }
        state.quotes[quote.id] = { owner, quote }
        return quote
      })
    },
    create(owner: string, input: unknown, key: string | null): { order: Order; replay: boolean; timeout: boolean } {
      const idempotencyKey = text(key, 'Idempotency-Key', 8, 200)
      const body = record(input)
      const collector = record(body.collector)
      const details: Record<string, string> = {}
      for (const field of ["handle","profileName","referralCode","ensName","note","secondaryWalletAddress","walletProvider"]) {
        if (collector[field] !== undefined && collector[field] !== '') details[field] = text(collector[field], 'collector.' + field, 1, field === 'note' ? 500 : ['handle', 'referralCode'].includes(field) ? 40 : 100)
      }
      if (details.walletProvider && !['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(details.walletProvider)) invalid('collector.walletProvider', 'Tipo de carteira inválido.')
      if (details.handle && !/^@[a-zA-Z0-9._-]+$/.test(details.handle)) invalid('collector.handle', 'Identificador inválido.')
      if (details.ensName && !/^[a-zA-Z0-9.-]+\.(eth|sol|polygon)$/.test(details.ensName)) invalid('collector.ensName', 'Informe um nome ENS válido.')
      if (details.secondaryWalletAddress && !/^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(details.secondaryWalletAddress)) invalid('collector.secondaryWalletAddress', 'Carteira secundária inválida.')
      const normalized = { quoteId: text(body.quoteId, 'quoteId'), items: lines(body.items), couponCode: couponCode(body.couponCode), walletId: text(body.walletId, 'walletId'), network: network(body.network), collector: { ...details, name: text(collector.name, 'collector.name', 2, 100), email: email(collector.email) } }
      const fingerprint = JSON.stringify(normalized)
      const scope = `${owner}:${idempotencyKey}`
      const existing = store.read().idempotency[scope]
      if (existing) {
        if (existing.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 409)
        return { order: get(owner, existing.orderId), replay: true, timeout: false }
      }
      const saved = store.read().quotes[normalized.quoteId]
      if (!saved || saved.owner !== owner) fail('NOT_FOUND', 404, 'Cotação não encontrada.')
      const quotedInput: QuoteInput = { items: saved.quote.items.map(({ nftId, quantity }) => ({ nftId, quantity })), couponCode: saved.quote.couponCode }
      if (JSON.stringify(quotedInput.items) !== JSON.stringify(normalized.items) || quotedInput.couponCode !== normalized.couponCode) invalid('quoteId', 'O pedido deve corresponder à cotação revisada.')
      const pricing = price(normalized)
      if (Date.parse(saved.quote.expiresAt) <= store.now() || saved.quote.totalEth !== pricing.totalEth || saved.quote.items.some((item, index) => item.unitPriceEth !== pricing.items[index].unitPriceEth)) fail('QUOTE_STALE', 409)
      const wallet = (store.read().wallets[owner] ?? []).find((item) => item.id === normalized.walletId)
      if (!wallet) fail('NOT_FOUND', 404, 'Carteira não encontrada.')
      if (wallet.network !== normalized.network || pricing.items.some((item) => item.network !== normalized.network)) invalid('network', 'A rede deve ser a mesma nos itens e na carteira.')
      let order = store.transaction((state) => {
        const now = new Date(store.now()).toISOString()
        const created: Order = { id: store.id('order'), status: 'pending', ...pricing, items: pricing.items.map((item) => ({ ...item, imageUrl: state.nfts.find((nft) => nft.id === item.nftId)!.imageUrl })), walletId: wallet.id, walletAddress: wallet.address, network: normalized.network, collector: normalized.collector, transactionRef: null, explorerUrl: null, failureReason: null, idempotencyKey, createdAt: now, updatedAt: now, version: 1 }
        state.orders.push(created)
        state.orderOwners[created.id] = owner
        state.idempotency[scope] = { orderId: created.id, fingerprint }
        return created
      })
      if (store.read().scenario !== 'payment-pending') order = settle(owner, order.id, store.read().scenario === 'payment-declined' ? 'declined' : 'confirmed')
      return { order, replay: false, timeout: store.read().scenario === 'order-timeout' }
    },
  }
}
