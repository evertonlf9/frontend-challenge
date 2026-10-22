import { waitForNetwork } from '@/network-ready'
export { marketplaceEvent as decodeMarketplaceEvent } from '@/infrastructure/api/response-contracts'

// Register the Socket.IO server before creating a client; REST startup need not load it.
if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
  await waitForNetwork()
  const { enableSocketMocks } = await import('@/mocks/browser')
  await enableSocketMocks()
}

// Engine.IO captures the global WebSocket when imported: load it after interception.
const { io } = await import('socket.io-client')

// Conectar apenas quando uma funcionalidade precisar de tempo real.
export const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
  autoConnect: false,
  transports: ['websocket'],
})
