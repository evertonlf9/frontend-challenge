import { describeArtwork } from '@/modules/nft/presentation/artwork-description'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useCartCoupon } from '../../application/use-cart-coupon'
import { useMarketplace } from '@/modules/shared/application/use-marketplace'
import { useResourceMutation } from '@/modules/shared/application/use-resource-mutation'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { QuantityControl } from '@/components/ui/QuantityControl'
import { FlowPageHeading } from '@/components/ui/FlowPageHeading'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { OrderTotals } from '@/modules/checkout/presentation/components/OrderTotals'
import { RelatedNfts } from '@/modules/nft/presentation/components/RelatedNfts'
import { mulEth } from '@/lib/money'

export function CartPage() {
  const { queries } = useMarketplace()
  const cart = useQuery(queries.cart())
  const [couponCode, setCouponCode] = useCartCoupon()
  const quote = useQuery(queries.quote({ items: (cart.data?.items ?? []).map(({ nftId, quantity }) => ({ nftId, quantity })), couponCode }))
  const update = useResourceMutation((api, context, input: { id: string; quantity: number }) => input.quantity === 0 ? api.cart.remove(input.id, context) : api.cart.update(input.id, { quantity: input.quantity }, context), ['cart', 'quote'])
  return <section className="page-shell cart-page">
    <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Carrinho' }]} />
    <FlowPageHeading title="Carrinho de NFTs" backTo="/" backLabel="Voltar ao catálogo" />
    <QueryFeedback query={cart} empty={cart.data?.items.length === 0} />
    {cart.data?.items.length === 0 && <Link to="/" className="text-primary">Continuar explorando</Link>}
    {!!cart.data?.items.length && <div className="cart-layout">
      <div>
        <table className="cart-table"><thead><tr><th scope="col">NFTs</th><th scope="col">Preço</th><th scope="col">Edições</th><th scope="col">Total</th><th scope="col"><span className="sr-only">Remover</span></th></tr></thead>
          <tbody>{cart.data.items.map((item) => <tr key={item.nftId}>
            <td><Link to="/nft/$id" params={{ id: item.nftId }} className="cart-product"><img src={item.imageUrl} alt={describeArtwork(item.imageUrl, item.name)} width={62} height={62} /><span><strong>{item.name}</strong><small className="cart-token">ID do token: {item.nftId}</small><small className="cart-edition" aria-label={`Edições selecionadas: ${item.quantity}; limite por pedido: ${item.maxPerOrder}`}>Edições: {item.quantity}/{item.maxPerOrder}</small></span></Link></td>
            <td className="cart-unit-price">{item.unitPriceEth} ETH</td>
            <td className="cart-quantity"><QuantityControl label={`Quantidade de ${item.name}`} value={item.quantity} maximum={Math.min(item.available, item.maxPerOrder)} disabled={update.isPending} onChange={(quantity) => update.mutate({ id: item.nftId, quantity })} /></td>
            <td className="cart-line-total">{mulEth(item.unitPriceEth, item.quantity)} ETH</td>
            <td className="cart-remove-cell"><button className="cart-remove" disabled={update.isPending} aria-label={`Remover ${item.name}`} onClick={() => update.mutate({ id: item.nftId, quantity: 0 })}><Trash2 size={15} aria-hidden="true" /></button></td>
          </tr>)}</tbody>
        </table>
        {update.error && <p role="alert">{update.error.message}</p>}
      </div>
      <aside className="order-summary" aria-label="Resumo do carrinho"><h2>Resumo da carteira</h2>
        <form className="coupon-form" onSubmit={(event) => { event.preventDefault(); setCouponCode(String(new FormData(event.currentTarget).get('coupon') ?? '')) }}>
          <label htmlFor="cart-coupon">Código promocional</label><div className="coupon-fields"><input id="cart-coupon" name="coupon" aria-label="Cupom" defaultValue={couponCode} placeholder="digite o código promocional..." /><Button type="submit" aria-label="Aplicar cupom">Aplicar</Button></div>
        </form>
        {couponCode && <button className="filter-reset" onClick={() => setCouponCode('')}>Remover cupom</button>}
        <QueryFeedback query={quote} />
        {quote.data && !quote.error && <><OrderTotals values={quote.data} /><Button asChild className="summary-cta"><Link to="/checkout" aria-label="Continuar para pagamento: Conectar e finalizar">Conectar e finalizar</Link></Button></>}
        <Link to="/" hash="catalogo" className="continue-shopping">Continuar explorando</Link>
      </aside>
    </div>}
    <RelatedNfts />
  </section>
}
