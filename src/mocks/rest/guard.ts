import { HttpResponse, delay } from 'msw'
import { getActiveScenario } from '../db/state'
import { getScenarioDefinition } from '../scenarios'
import { serviceUnavailable } from './errors'

let flakyCounter = 0
let catalogCounter = 0

let latencyCounter = 0
export function resetLatency() { flakyCounter = 0; catalogCounter = 0; latencyCounter = 0 }

/**
 * Aplica os efeitos globais do cenário ativo.
 * Retorna uma `Response` quando a requisição deve ser curto-circuitada.
 */
export async function applyScenarioEffects(): Promise<Response | null> {
  const scenario = getScenarioDefinition(getActiveScenario())

  if (scenario.offline) {
    return HttpResponse.error()
  }

  if (scenario.serverError) {
    return serviceUnavailable()
  }

  if (scenario.failureRate) {
    flakyCounter += 1
    if (flakyCounter % 3 === 0) {
      return serviceUnavailable()
    }
  }

  return null
}

/** Aplica a latência do cenário ativo somada a um valor opcional. */
export async function applyLatency(extraMs = 0): Promise<void> {
  const scenario = getScenarioDefinition(getActiveScenario())
  const base = scenario.latencyMs ? scenario.latencyMs[0] + ((latencyCounter++ % 5) / 4) * (scenario.latencyMs[1] - scenario.latencyMs[0]) : 0
  const total = base + extraMs
  if (total > 0) {
    await delay(total)
  }
}

/**
 * Latência variável da listagem no cenário "out-of-order": requisições
 * alternadas resolvem depois das mais recentes, exercitando o descarte
 * de respostas obsoletas no cliente.
 */
export function catalogLatency(): number {
  const scenario = getScenarioDefinition(getActiveScenario())
  if (!scenario.outOfOrder) {
    return 0
  }
  catalogCounter += 1
  return catalogCounter % 2 === 0 ? 250 : 1_600
}
