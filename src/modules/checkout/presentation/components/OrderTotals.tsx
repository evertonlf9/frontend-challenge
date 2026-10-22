import type { Quote } from '../../domain/quote.contracts'
type Totals = Pick<Quote, 'subtotalEth' | 'discountEth' | 'networkFeeEth' | 'totalEth'>
export function OrderTotals({ values, totalLabel = 'Total' }: { values: Totals; totalLabel?: string }) {
  return <dl className="summary-values">
    <div className="summary-row"><dt>Subtotal</dt><dd>{values.subtotalEth} ETH</dd></div>
    <div className="summary-row"><dt>Desconto</dt><dd>− {values.discountEth} ETH</dd></div>
    <div className="summary-row"><dt>Taxa de rede</dt><dd>{values.networkFeeEth} ETH<small className="fee-estimate">Taxa estimada</small></dd></div>
    <div className="summary-row summary-total"><dt>{totalLabel}</dt><dd>{values.totalEth} ETH</dd></div>
  </dl>
}
