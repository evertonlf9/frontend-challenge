import type { Quote } from '../domain/quote.contracts'

/** IDs e datas mudam a cada revalidação; apenas condições comerciais exigem nova revisão. */
export function quoteFingerprint(quote: Quote): string {
  return JSON.stringify({ items: quote.items, couponCode: quote.couponCode, subtotal: quote.subtotalEth, discount: quote.discountEth, fee: quote.networkFeeEth, total: quote.totalEth, availability: quote.availability })
}
