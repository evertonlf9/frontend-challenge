import type { useCheckout } from '../../application/use-checkout'
import { ReviewDialog } from '@/components/ui/ReviewDialog'
import { FormError } from '@/components/ui/FormError'
import { Button } from '@/components/ui/button'
import { OrderTotals } from './OrderTotals'

export function CheckoutReview({ checkout }: { checkout: ReturnType<typeof useCheckout> }) {
  const { review, busy } = checkout
  return <ReviewDialog open={!!review} onClose={() => { if (!busy) checkout.closeReview() }} className="content-dialog checkout-review-dialog" initialFocus="[data-review-back]">
    <h2 id="review-title">Revisar pedido</h2>
    {review && <>
      <div className="review-collector"><strong>{review.collector.name}</strong><span>{review.collector.email}</span><p>{checkout.wallet?.label} · {checkout.chain} · {checkout.provider}</p></div>
      <ul className="review-items">{review.quote.items.map((item) => <li key={item.nftId} data-reading-target><span>{item.name}<small>{item.quantity} {item.quantity === 1 ? 'edição' : 'edições'}</small></span><strong>{item.subtotalEth} ETH</strong></li>)}</ul>
      <OrderTotals values={review.quote} totalLabel="Total revisado" />
      {(checkout.notice || checkout.changed) && <p role="alert" className="dialog-notice">{checkout.notice || 'O catálogo mudou. Revalide os valores antes de confirmar a compra.'}</p>}
      <FormError error={checkout.confirm.error} id="quote-error" />
      <div className="dialog-actions"><Button data-review-back autoFocus variant="outline" disabled={busy} onClick={checkout.closeReview}>Voltar e editar</Button><Button disabled={busy || !checkout.connected || !!checkout.pending} onClick={() => checkout.confirm.mutate()}>{busy ? 'Enviando pedido…' : 'Confirmar compra simulada'}</Button></div>
    </>}
  </ReviewDialog>
}
