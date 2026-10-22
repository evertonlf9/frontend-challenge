import { useEffect } from 'react'
import type { Order } from '@/modules/orders/domain/order.contracts'
import { useMarketplace, useSession } from '@/modules/shared/application/use-marketplace'
import { getSessionToken } from '@/lib/session-storage'
import { finishConfirmedCheckout } from './checkout-draft'

export function useCheckoutCompletion(order?: Order) {
  const { token } = useMarketplace()
  const session = useSession()
  const owner = session.data?.account.id
  useEffect(() => {
    if (owner && order && getSessionToken() === token) finishConfirmedCheckout(owner, order)
  }, [owner, order, token])
}
