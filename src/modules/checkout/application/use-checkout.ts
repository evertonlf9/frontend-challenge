import { finishConfirmedCheckout, rememberSubmittedCheckout } from './checkout-draft'
import { useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useMarketplace, useSession, useCreateOrder } from '@/modules/shared/application/use-marketplace'
import { useCartCoupon } from '@/modules/cart/application/use-cart-coupon'
import { orderAttempt, pendingAttempt, clearAttempt } from '@/modules/orders/application/order-attempt'
import { quoteFingerprint } from './quote-review'
import { isApiError } from '@/lib/api-error'
import { getSessionToken } from '@/lib/session-storage'
import type { Quote } from '../domain/quote.contracts'
import type { CreateOrderInput } from '@/modules/orders/domain/order.contracts'

export function useCheckout() {
  const { api, token, queries } = useMarketplace()
  const session = useSession()
  const owner = session.data?.account.id
  const profile = useQuery(queries.profile())
  const [provider, setProvider] = useState("MetaMask")
  const cart = useQuery(queries.cart())
  const wallets = useQuery(queries.wallets())
  const [coupon, setCoupon] = useCartCoupon()
  const quoteInput = { items: (cart.data?.items ?? []).map(({ nftId, quantity }) => ({ nftId, quantity })), couponCode: coupon }
  const quote = useQuery(queries.quote(quoteInput))
  const [walletId, selectWallet] = useState('')
  const [network, selectNetwork] = useState('')
  const wallet = wallets.data?.items.find((item) => item.id === walletId) ?? wallets.data?.items.find((item) => item.isPrimary) ?? wallets.data?.items[0]
  const chain = network || wallet?.network || 'ethereum'
  const [connectionId, setConnectionId] = useState('')
  const connected = connectionId === wallet?.id + ':' + chain
  const [review, setReview] = useState<{ quote: Quote; collector: CreateOrderInput['collector'] } | null>(null)
  const [notice, setNotice] = useState('')
  const [submissionError, setSubmissionError] = useState<unknown>(null)
  const [formVersion, setFormVersion] = useState(0)
  const lock = useRef(false)
  const create = useCreateOrder()
  const navigate = useNavigate()
  const pending = owner ? pendingAttempt(owner) : null
  const connection = useMutation({
    mutationFn: () => api.wallets.connect(wallet!.id, chain, { sessionToken: token }),
    onSuccess: (data) => { if (getSessionToken() === token) setConnectionId(data.walletId + ':' + data.network) },
  })
  const disconnect = useMutation({
    mutationFn: () => api.wallets.disconnect(wallet!.id, { sessionToken: token }),
    onSuccess: () => setConnectionId(''),
  })
  const send = async (input: CreateOrderInput) => {
    if (!owner || lock.current) return
    lock.current = true
    setSubmissionError(null)
    try {
      const order = await create.mutateAsync(input)
      if (getSessionToken() !== token) return
      clearAttempt(owner, input.idempotencyKey)
      rememberSubmittedCheckout(owner, order.id)
      if (finishConfirmedCheckout(owner, order)) {
        setReview(null)
        setNotice('')
        setConnectionId('')
        setProvider('MetaMask')
        selectWallet('')
        selectNetwork('')
        setFormVersion((version) => version + 1)
      }
      await navigate({ to: '/orders/$id', params: { id: order.id } })
    } catch (error) {
      if (getSessionToken() !== token) return
      // Keep feedback attached to the attempt even if realtime empties the cart
      // or mutation observers are refreshed while the transport is timing out.
      setSubmissionError(error)
      setReview(null)
      if (isApiError(error) && !error.isRetriable && error.status !== 401 && error.code !== 'INVALID_RESPONSE') {
        clearAttempt(owner, input.idempotencyKey); setReview(null); void quote.refetch()
      }
    } finally { lock.current = false }
  }
  const confirm = useMutation({
    mutationFn: async () => {
      if (!review || !wallet || !owner || !connected || lock.current) return
      const fresh = await api.quote.create(quoteInput, { sessionToken: token })
      if (getSessionToken() !== token) return
      if (quoteFingerprint(fresh) !== quoteFingerprint(review.quote)) {
        setReview({ ...review, quote: fresh })
        setNotice('Preço, disponibilidade ou taxas alterados. Revise os novos valores e confirme novamente.')
        return
      }
      await send(orderAttempt(owner, {
        quoteId: fresh.id, items: fresh.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
        walletId: wallet.id, network: wallet.network, couponCode: fresh.couponCode, collector: review.collector,
      }))
    },
  })
  return {
    session, owner, profile, provider, formVersion, cart, wallets, wallet, chain, coupon, setCoupon, quote, connected, connection, disconnect, review, notice, create, submissionError: submissionError ?? create.error, confirm, pending,
    selectProvider: (value: string) => { setProvider(value); setConnectionId("") },
    busy: create.isPending || confirm.isPending,
    changed: !!review && !!quote.data && quoteFingerprint(review.quote) !== quoteFingerprint(quote.data),
    selectWallet: (id: string) => { selectWallet(id); selectNetwork(''); setConnectionId('') },
    selectNetwork: (value: string) => { selectNetwork(value); setConnectionId('') },
    closeReview: () => { setReview(null); confirm.reset() },
    startReview: (collector: CreateOrderInput['collector']) => { if (quote.data && connected && !pending) { setNotice(''); setReview({ quote: quote.data, collector }) } },
    recover: () => { if (pending) void send(pending) },
  }
}
