import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { mockEvents, socketControls } from './events'
import { mockApi } from './api'

const socketUrl = new URL(import.meta.env.VITE_SOCKET_URL || window.location.origin)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
// MSW normaliza o prefixo /socket.io/ para a raiz ao comparar a URL.
socketUrl.pathname = '/'

const connection = ws.link(socketUrl.toString())

export const socketHandlers = [
  connection.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const removeControl = socketControls.subscribe(() => connection.client.close(1012, "Interrupção simulada"))
    connection.client.addEventListener("close", removeControl)
    let userId: string | null = null
    let subscriptionToken: string | null = null
    io.client.on('session.subscribe', (_event, token: string) => {
      try { userId = mockApi.accounts.authenticate(token).user.id; subscriptionToken = token } catch { userId = null; subscriptionToken = null }
    })
    const unsubscribe = mockEvents.subscribe((event) => {
      if (event.type === 'order.updated' && subscriptionToken) {
        try { mockApi.accounts.authenticate(subscriptionToken) } catch { return }
      }
      if (event.type === 'nft.updated' || (event.type === 'order.updated' && event.userId === userId)) {
        io.client.emit(event.type, event)
      }
    })
    connection.client.addEventListener('close', unsubscribe)
    const heartbeat = setInterval(() => connection.client.send('2'), 25_000)
    connection.client.addEventListener('close', () => clearInterval(heartbeat))
    // Evento técnico para validar o transporte Socket.IO através do MSW.
    io.client.on('health.check', () => {
      io.client.emit('health.ok', { status: 'ok' })
    })
  }),
]
