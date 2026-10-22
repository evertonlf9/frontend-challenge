import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMarketplace, useSession } from './use-marketplace'
import { getSessionToken } from '@/lib/session-storage'
import { keys } from './queries'
import type { Order } from '@/modules/orders/domain/order.contracts'
import type { Nft } from '@/modules/nft/domain/nft.contracts'

export function useRealtime() {
  const [message, setMessage] = useState('')
  const { token, queries } = useMarketplace()
  const session = useSession()
  const userId = session.data?.account.id
  const client = useQueryClient()
  const scope = queries.scope
  useEffect(() => {
    let disposed = false
    let cleanup: (() => void) | undefined
    void import('@/lib/socket').then(({ socket, decodeMarketplaceEvent }) => {
      if (disposed) return
      let connectedOnce = false
      const disconnected = () => { if (!disposed) setMessage("Conexão em tempo real interrompida. Os pedidos continuam disponíveis pela API.") }
      const versions = new Map<string, number>()
      const reconcile = () => {
        if (disposed || getSessionToken() !== token) return
        if (connectedOnce) setMessage("Conexão restabelecida. Dados reconciliados com a API.")
        connectedOnce = true
        if (token) socket.emit('session.subscribe', token)
        void client.invalidateQueries({ queryKey: keys.nfts })
        void client.invalidateQueries({ queryKey: keys.private(scope) })
      }
      const receive = async (payload: unknown) => {
        let event
        try { event = decodeMarketplaceEvent(payload) } catch { return }
        if (disposed || getSessionToken() !== token) return
        const versionKey = `${event.type}:${event.resourceId}`
        const queryKey = event.type === 'nft.updated' ? keys.detail(event.resourceId) : [...keys.resource(scope, 'orders'), event.resourceId]
        const current = client.getQueryData<Nft | Order>(queryKey)
        if (event.version <= Math.max(versions.get(versionKey) ?? 0, current?.version ?? 0)) return
        if (event.type === 'order.updated' && (event.userId !== userId || (current && 'status' in current && current.status !== 'pending'))) return
        versions.set(versionKey, event.version)
        await client.cancelQueries({ queryKey })
        if (disposed || getSessionToken() !== token || versions.get(versionKey) !== event.version) return
        if (event.type === 'nft.updated') setMessage('Preço ou disponibilidade de NFT atualizados. Revise os valores do carrinho.')
        client.setQueryData(queryKey, event.data)
        if (event.type === 'nft.updated') {
          void client.invalidateQueries({ queryKey: [...keys.nfts, 'list'] })
          void client.invalidateQueries({ queryKey: keys.resource(scope, 'favorites') })
        }
        for (const resource of ['cart', 'quote', 'orders']) {
          void client.invalidateQueries({ queryKey: keys.resource(scope, resource) })
        }
      }
      socket.on('disconnect', disconnected)
      socket.on('connect', reconcile)
      socket.on('nft.updated', receive)
      socket.on('order.updated', receive)
      socket.connect()
      cleanup = () => { socket.off('disconnect', disconnected); socket.off('connect', reconcile); socket.off('nft.updated', receive); socket.off('order.updated', receive); socket.disconnect() }
    }).catch((error: unknown) => console.error('Falha ao conectar tempo real:', error))
    return () => { disposed = true; cleanup?.() }
  }, [client, token, userId, scope])
  return { message }
}
