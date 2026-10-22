import '@/styles/account.css'
import { useCheckoutCompletion } from '../../application/use-checkout-completion'
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useMarketplace } from '@/modules/shared/application/use-marketplace'
import { QueryFeedback } from '@/components/ui/QueryFeedback'
import { ReviewDialog } from '@/components/ui/ReviewDialog'
import { HomePage } from '@/modules/nft/presentation/pages/HomePage'
import { AccountLayout } from '@/modules/profile/presentation/components/AccountLayout'
import { OrderReceipt } from '../components/OrderReceipt'

const statuses = { pending: 'Pendente', confirmed: 'Confirmado', declined: 'Recusado' } as const
export function ConfirmationPage() {
  const params = useParams({ strict: false })
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const { queries } = useMarketplace()
  const id = params.id ?? search.orderId ?? ''
  const query = useQuery(queries.order(id))
  useCheckoutCompletion(query.data)
  const orders = useQuery({ ...queries.orders(), enabled: !id })
  const close = () => { void navigate({ to: '/confirmation' }) }
  if (!id) return <AccountLayout><h1>Pedidos</h1><QueryFeedback query={orders} empty={orders.data?.items.length === 0} /><div className="orders-list">{orders.data?.items.map((item) => <Link to="/orders/$id" params={{ id: item.id }} key={item.id}><strong>{item.id}</strong><span>{statuses[item.status]}</span><span>{item.totalEth} ETH</span></Link>)}</div></AccountLayout>
  return <>
    <HomePage />
    <ReviewDialog open onClose={close} initialFocus="#receipt-title" labelledBy="receipt-title" className="receipt-modal">
      <button type="button" className="receipt-close" aria-label="Fechar comprovante" onClick={close}><X size={18} strokeWidth={1.25} aria-hidden="true" /></button>
      {query.data ? <OrderReceipt order={query.data} /> : <div className="receipt-loading"><h1 id="receipt-title" tabIndex={-1}>{query.error ? 'Não foi possível recuperar o pedido' : 'Carregando pedido'}</h1><QueryFeedback query={query} /></div>}
    </ReviewDialog>
  </>
}
