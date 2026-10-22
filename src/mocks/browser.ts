import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

let socketMocks: Promise<void> | undefined
export function enableSocketMocks(): Promise<void> {
  socketMocks ??= import('./socket').then(({ socketHandlers }) => { worker.use(...socketHandlers) })
  return socketMocks
}
