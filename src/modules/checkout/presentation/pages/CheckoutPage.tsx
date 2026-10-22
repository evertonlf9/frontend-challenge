import { Link } from '@tanstack/react-router'
import { FormError } from '@/components/ui/FormError'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { FlowPageHeading } from '@/components/ui/FlowPageHeading'
import { CheckoutReview } from '../components/CheckoutReview'
import { MobileCheckoutWallets } from '../components/MobileCheckoutWallets'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { useCheckout } from '../../application/use-checkout'
import { CollectorForm } from '../components/CollectorForm'
import { OrderTotals } from '../components/OrderTotals'

export function CheckoutPage() {
  const checkout = useCheckout()
  const { owner, cart, wallets, quote, busy } = checkout
  return <section className="page-shell checkout-page">
    <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Pagamento' }]} />
    <FlowPageHeading title="Pagamento" mobileTitle="Pagamento com carteira" backTo="/cart" backLabel="Voltar ao carrinho" />
    <QueryFeedback query={cart} empty={cart.data?.items.length === 0} />
    {cart.data?.items.length === 0 && <Link to="/" className="text-primary">Explorar NFTs</Link>}
    {checkout.pending && <div role="status" className="space-y-3 mb-6"><p>Existe uma tentativa anterior. Recupere o resultado antes de enviar outra compra.</p><Button disabled={busy} onClick={checkout.recover}>Recuperar tentativa anterior</Button></div>}
    <QueryFeedback query={wallets} />
    {wallets.data?.items.length === 0 && <p className="mb-5"><Link to="/wallets" className="text-primary">Cadastrar carteira</Link></p>}
    <FormError error={checkout.submissionError} id="checkout-error" />
    {!!cart.data?.items.length && owner && <div className="checkout-layout">
      <CollectorForm key={checkout.formVersion} checkout={checkout} />
      <aside className="order-summary" aria-label="Resumo do pedido"><div className="checkout-order-overview"><h2>Seus NFTs</h2>
        <div className="summary-row text-xs"><span>NFTs</span><span>Subtotal</span></div>
        {cart.data.items.map((item) => <div className="checkout-item" key={item.nftId}><img src={item.imageUrl} alt={item.name} width={50} height={50} /><p><strong>{item.name}</strong><br />({item.quantity} {item.quantity === 1 ? 'edição' : 'edições'})</p><span>{quote.data?.items.find((line) => line.nftId === item.nftId)?.subtotalEth ?? item.unitPriceEth} ETH</span></div>)}
        <form className="coupon-form mt-4" onSubmit={(event) => { event.preventDefault(); checkout.setCoupon(String(new FormData(event.currentTarget).get('coupon') ?? '')) }}>
          <label htmlFor="checkout-coupon">Tem um código promocional? Aplique aqui.</label><div className="coupon-fields"><input id="checkout-coupon" aria-label="Cupom" name="coupon" defaultValue={checkout.coupon} placeholder="Código promocional" /><Button type="submit" aria-label="Aplicar cupom">Aplicar</Button></div>
        </form>
        {checkout.coupon && <button className="filter-reset" onClick={() => checkout.setCoupon('')}>Remover cupom</button>}
        <QueryFeedback query={quote} />
        {quote.data && !quote.error && <OrderTotals values={quote.data} />}
        </div>
        <section className="wallet-selection"><MobileCheckoutWallets checkout={checkout} /><h3>Carteira e rede</h3>
          {['WalletConnect', 'MetaMask', 'Coinbase Wallet'].map((provider) => <label className="wallet-option" key={provider}><input type="radio" name="wallet-provider" value={provider} checked={checkout.provider === provider} onChange={() => checkout.selectProvider(provider)} /><span className="provider-icon" aria-hidden="true">{provider === 'MetaMask' ? 'M' : provider === 'WalletConnect' ? 'W' : 'C'}</span><span>{provider}</span></label>)}
          {checkout.connected ? <><p className="checkout-notice" role="status">Carteira conectada à rede {checkout.chain} (simulação).</p><Button variant="outline" className="w-full" disabled={checkout.disconnect.isPending} onClick={() => checkout.disconnect.mutate()}>Desconectar carteira</Button></> : <Button variant="outline" className="summary-cta" disabled={!checkout.wallet || checkout.connection.isPending} onClick={() => checkout.connection.mutate()}>Conectar carteira simulada</Button>}
          {quote.data && <p className="mobile-checkout-total"><span>Total:</span><strong>{quote.data.totalEth} ETH</strong></p>}
          <FormError error={checkout.connection.error ?? checkout.disconnect.error} id="connection-error" />
          <Button type="submit" form="collector-form" className="summary-cta" disabled={busy || quote.isFetching || !!quote.error || !checkout.connected || !!checkout.pending}>Confirmar compra</Button>
        </section>
      </aside>
    </div>}
    <CheckoutReview checkout={checkout} />
  </section>
}
