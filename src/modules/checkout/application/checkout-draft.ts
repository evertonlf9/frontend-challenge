import type { CollectorDetails, Order } from '@/modules/orders/domain/order.contracts'
import { clearAttempt, pendingAttempt } from '@/modules/orders/application/order-attempt'
import { getCartCoupon, setCartCoupon } from '@/modules/cart/application/use-cart-coupon'

const draftKey = (owner: string) => 'kurio.checkout.draft:' + owner
const submittedOrderKey = (owner: string) => draftKey(owner) + ':order'

export function readCheckoutDraft(owner?: string): Record<string, string> {
  if (!owner) return {}
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(draftKey(owner)) ?? '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(
      Object.entries(saved).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    )
  } catch {
    return {}
  }
}
export function saveCheckoutDraft(owner: string | undefined, values: CollectorDetails): void {
  if (!owner) return
  sessionStorage.setItem(draftKey(owner), JSON.stringify(values))
  sessionStorage.removeItem(submittedOrderKey(owner))
}
export function rememberSubmittedCheckout(owner: string, orderId: string): void {
  sessionStorage.setItem(submittedOrderKey(owner), orderId)
}

/** Limpa somente o rascunho associado ao pedido confirmado, sem tocar em uma compra posterior. */
export function finishConfirmedCheckout(owner: string, order: Order): boolean {
  if (order.status !== 'confirmed') return false
  const attempt = pendingAttempt(owner)
  const submitted = sessionStorage.getItem(submittedOrderKey(owner))
  if (submitted !== order.id && attempt?.idempotencyKey !== order.idempotencyKey) return false
  sessionStorage.removeItem(draftKey(owner))
  sessionStorage.removeItem(submittedOrderKey(owner))
  if (getCartCoupon() === (order.couponCode ?? '')) setCartCoupon('')
  if (attempt?.idempotencyKey === order.idempotencyKey) clearAttempt(owner, order.idempotencyKey)
  return true
}
