import { describeArtwork } from '@/modules/nft/presentation/artwork-description'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Clock3, CircleX } from 'lucide-react'
import type { Order } from '@/modules/orders/domain/order.contracts'
import { Button } from '@/components/ui/button'

const networkNames = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const explorers = { ethereum: 'Etherscan', polygon: 'Polygonscan', solana: 'Solana Explorer' }
function ThankYouIcon() {
  return <svg className="receipt-thank-you" width="64" height="76" viewBox="0 0 64 76" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M11 37 9 40v32h45V40l-3-3M9 41l23 17 22-17M9 72l18-17m27 17L37 55M27 20l5-4 5 4" /><path d="M14 49V21h36v28" /><text x="32" y="34" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="monospace" fontSize="10" fontWeight="700">THANK</text><text x="32" y="44" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="monospace" fontSize="10" fontWeight="700">YOU</text></svg>
}
export function OrderReceipt({ order }: { order: Order }) {
  const [explorerNotice, setExplorerNotice] = useState(false)
  const confirmed = order.status === 'confirmed'
  const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).formatToParts(new Date(order.createdAt)).filter((part) => ['day', 'month', 'year'].includes(part.type)).map((part) => part.value).join(' ')
  return <>
    <header className="receipt-status">{confirmed ? <ThankYouIcon /> : order.status === 'pending' ? <Clock3 size={52} aria-hidden="true" /> : <CircleX size={52} aria-hidden="true" />}
      <h1 id="receipt-title" tabIndex={-1} aria-live="polite">{confirmed ? <><span className="sr-only">Compra confirmada. </span>Seus NFTs agora estão na sua carteira</> : order.status === 'pending' ? 'Pedido pendente' : 'Pagamento recusado'}</h1>
    </header>
    <dl className="receipt-metadata"><div><dt>ID da transação</dt><dd title={order.transactionRef ?? order.id}>{order.transactionRef ?? order.id}</dd></div><div><dt>Data</dt><dd><time dateTime={order.createdAt}>{date}</time></dd></div><div><dt>Total</dt><dd>{order.totalEth} ETH</dd></div><div><dt>Carteira</dt><dd>{order.collector.walletProvider ?? 'Simulada'}</dd></div></dl>
    <section className="receipt-body" aria-label="Detalhes da transação">
      <h2>Detalhes da transação</h2>
      <table className="receipt-table"><thead><tr><th scope="col">NFTs</th><th scope="col">Edições</th><th scope="col">Subtotal</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.nftId}><td><div className="receipt-product"><img src={item.imageUrl} alt={describeArtwork(item.imageUrl, item.name)} width={50} height={50} /><div><strong>{item.name}</strong><span>ID do token: {item.name.match(/#\d+/)?.[0] ?? item.nftId}</span></div></div></td><td>(x {item.quantity})</td><td>{item.subtotalEth} ETH</td></tr>)}</tbody></table>
      <dl className="receipt-amounts">{order.discountEth !== '0' && <div><dt>Desconto</dt><dd>− {order.discountEth} ETH</dd></div>}<div><dt>Taxa de rede</dt><dd>{order.networkFeeEth} ETH</dd></div></dl>
      <p className="receipt-total"><span>Total: </span><strong>{order.totalEth} ETH</strong></p>
      <p className="receipt-message">{confirmed ? `Transação simulada confirmada em ${networkNames[order.network]}. Na demonstração, os NFTs foram registrados na sua carteira.` : order.failureReason ?? 'Aguardando o resultado da simulação. Este pedido será atualizado automaticamente.'}</p>
      {confirmed && <><Button className="receipt-explorer" onClick={() => setExplorerNotice((value) => !value)} aria-expanded={explorerNotice} aria-controls="receipt-explorer-notice">Ver no {explorers[order.network]}</Button>{explorerNotice && <p id="receipt-explorer-notice" role="status" className="receipt-message">Esta transação é simulada e não possui registro no {explorers[order.network]}.</p>}</>}
      {order.status === 'declined' && <Button asChild className="receipt-explorer"><Link to="/cart">Voltar ao carrinho</Link></Button>}
      <details className="receipt-collector"><summary>Dados do colecionador e pedido</summary><div><p>Pedido: {order.id}</p><p>{order.collector.name}</p><p>{order.collector.email}</p>{order.collector.handle && <p>{order.collector.handle}</p>}{order.collector.profileName && <p>Perfil: {order.collector.profileName}</p>}{order.collector.ensName && <p>Nome ENS: {order.collector.ensName}</p>}{order.collector.secondaryWalletAddress && <p>Carteira secundária: {order.collector.secondaryWalletAddress}</p>}{order.collector.referralCode && <p>Indicação: {order.collector.referralCode}</p>}{order.collector.note && <blockquote>{order.collector.note}</blockquote>}<p>Rede: {networkNames[order.network]}</p><p>Carteira: {order.walletAddress}</p></div></details>
    </section>
  </>
}
