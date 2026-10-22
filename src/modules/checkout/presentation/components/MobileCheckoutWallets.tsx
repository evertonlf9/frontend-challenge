import { useRef } from 'react'
import type { useCheckout } from '../../application/use-checkout'

export function MobileCheckoutWallets({ checkout }: { checkout: ReturnType<typeof useCheckout> }) {
  const group = useRef<HTMLFieldSetElement>(null)
  return <section className="mobile-checkout-wallets" aria-labelledby="mobile-wallet-title">
    <div className="mobile-wallet-heading"><h2 id="mobile-wallet-title">{checkout.connected ? 'Carteira conectada' : 'Suas carteiras'}</h2><button type="button" onClick={() => group.current?.querySelector('input')?.focus()}>Trocar carteira</button></div>
    <fieldset ref={group}><legend className="sr-only">Selecionar carteira para pagamento</legend>{checkout.wallets.data?.items.map((wallet) => <label className="mobile-wallet-card" key={wallet.id}><input type="radio" name="payment-wallet" checked={checkout.wallet?.id === wallet.id} onChange={() => checkout.selectWallet(wallet.id)} aria-label={`Selecionar carteira ${wallet.label}`} /><span><strong>{wallet.label}</strong><small title={wallet.address}>{wallet.ensName || wallet.address.slice(0, 7) + '…' + wallet.address.slice(-4)}</small><small>Rede {wallet.network}</small></span></label>)}</fieldset>
  </section>
}
