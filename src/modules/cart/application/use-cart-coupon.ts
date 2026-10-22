import { useSyncExternalStore } from 'react'

const key = 'kurio.cart.coupon'
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const getCartCoupon = () => localStorage.getItem(key) ?? ''
export function setCartCoupon(value: string) {
  localStorage.setItem(key, value.trim().toUpperCase())
  for (const listener of listeners) listener()
}

/** Preferência pública do carrinho: preservada também durante a autenticação. */
export function useCartCoupon() {
  const coupon = useSyncExternalStore(subscribe, getCartCoupon, () => '')
  return [coupon, setCartCoupon] as const
}
