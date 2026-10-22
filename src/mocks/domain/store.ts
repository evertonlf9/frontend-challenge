import type { MockState } from './models'

/** Porta transacional: os casos de uso não conhecem localStorage nem MSW. */
export interface MockStore {
  read(): MockState
  transaction<T>(work: (state: MockState) => T): T
  id(prefix: string): string
  now(): number
}
