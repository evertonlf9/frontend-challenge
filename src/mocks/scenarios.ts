/**
 * Cenários de mock determinísticos e reproduzíveis.
 * São selecionados em tempo de execução pelo endpoint de controle
 * (ver src/mocks/rest/control.ts) ou pela variável VITE_MOCK_SCENARIO.
 */
export const MOCK_SCENARIOS = [
  'default',
  'slow',
  'flaky',
  'favorite-error',
  'offline',
  'server-error',
  'empty-catalog',
  'out-of-order',
  'session-expired',
  'coupon-invalid',
  'availability-conflict',
  'payment-declined',
  'payment-pending',
  'order-timeout',
  'wallet-refused',
  'invalid-catalog-response',
  'invalid-order-response',
] as const

export type MockScenarioId = (typeof MOCK_SCENARIOS)[number]

export const DEFAULT_SCENARIO: MockScenarioId = 'default'

export interface ScenarioDefinition {
  id: MockScenarioId
  label: string
  description: string
  /** Faixa de latência artificial em milissegundos. */
  latencyMs?: [number, number]
  /** Proporção de respostas 503 (0 a 1). */
  failureRate?: number
  /** Simula queda de conexão (falha de rede). */
  offline?: boolean
  /** Toda requisição responde 503 SERVICE_UNAVAILABLE. */
  serverError?: boolean
  /** Sessões existentes passam a expirar e rotas privadas falham com 401. */
  expireSession?: boolean
  /** Catálogo responde sem itens. */
  emptyCatalog?: boolean
  /** Cotação rejeita qualquer cupom com COUPON_INVALID. */
  couponInvalid?: boolean
  /** Carrinho, cotação e pedido retornam AVAILABILITY_CONFLICT. */
  availabilityConflict?: boolean
  /** Pedido é criado e finalizado como `declined`. */
  paymentDeclined?: boolean
  /** Primeira criação de pedido estoura timeout após persistir; retry recupera. */
  orderTimeout?: boolean
  /** Respostas do catálogo chegam fora de ordem. */
  outOfOrder?: boolean
}

const DEFINITIONS: Record<MockScenarioId, ScenarioDefinition> = {
  'invalid-catalog-response': { id: 'invalid-catalog-response', label: 'Contrato de catálogo inválido', description: 'A listagem devolve preço numérico para exercitar a validação do cliente.' },
  'invalid-order-response': { id: 'invalid-order-response', label: 'Resposta inválida após compra', description: 'Persiste o pedido, mas devolve total inválido na primeira resposta; replay recupera o resultado correto.' },
  'wallet-refused': { id: 'wallet-refused', label: 'Conexão recusada', description: 'A carteira recusa a simulação de conexão.' },
  'favorite-error': { id: 'favorite-error', label: 'Falha em favoritos', description: 'Leituras funcionam; mutations de favoritos retornam 503 para exercitar rollback.', latencyMs: [600, 600] },
  'payment-pending': { id: 'payment-pending', label: 'Pedido pendente', description: 'Mantém o pedido pendente até encerramento pelo endpoint de controle.' },
  default: {
    id: 'default',
    label: 'Padrão',
    description: 'Comportamento estável, sem latência artificial.',
  },
  slow: {
    id: 'slow',
    label: 'Latência alta',
    description: 'Adiciona de 1,2s a 2,5s em toda resposta.',
    latencyMs: [1_200, 2_500],
  },
  flaky: {
    id: 'flaky',
    label: 'Instável',
    description: 'Intercala falhas transitórias 503 em parte das requisições.',
    latencyMs: [200, 600],
    failureRate: 0.4,
  },
  offline: {
    id: 'offline',
    label: 'Sem conexão',
    description: 'Toda requisição falha como erro de rede.',
    offline: true,
  },
  'server-error': {
    id: 'server-error',
    label: 'Indisponível',
    description: 'Toda requisição responde 503 SERVICE_UNAVAILABLE.',
    serverError: true,
  },
  'empty-catalog': {
    id: 'empty-catalog',
    label: 'Catálogo vazio',
    description: 'A listagem de NFTs retorna sem resultados.',
    emptyCatalog: true,
  },
  'out-of-order': {
    id: 'out-of-order',
    label: 'Respostas fora de ordem',
    description: 'A listagem responde com atraso variável, exercitando descarte de respostas obsoletas.',
    outOfOrder: true,
  },
  'session-expired': {
    id: 'session-expired',
    label: 'Sessão expirada',
    description: 'Rotas privadas respondem 401 SESSION_EXPIRED e sessões ficam inválidas.',
    expireSession: true,
  },
  'coupon-invalid': {
    id: 'coupon-invalid',
    label: 'Cupom inválido',
    description: 'A cotação rejeita qualquer cupom com COUPON_INVALID.',
    couponInvalid: true,
  },
  'availability-conflict': {
    id: 'availability-conflict',
    label: 'Conflito de disponibilidade',
    description: 'Carrinho, cotação e pedido retornam 409 AVAILABILITY_CONFLICT.',
    availabilityConflict: true,
  },
  'payment-declined': {
    id: 'payment-declined',
    label: 'Pagamento recusado',
    description: 'O pedido é aceito e evolui para o estado `declined`.',
    paymentDeclined: true,
  },
  'order-timeout': {
    id: 'order-timeout',
    label: 'Timeout no pedido',
    description: 'A primeira criação persiste o pedido e estoura timeout; reenviar com a mesma chave recupera o pedido.',
    orderTimeout: true,
  },
}

export function isMockScenario(value: unknown): value is MockScenarioId {
  return typeof value === 'string' && (MOCK_SCENARIOS as readonly string[]).includes(value)
}

export function getScenarioDefinition(id: MockScenarioId): ScenarioDefinition {
  return DEFINITIONS[id] ?? DEFINITIONS.default
}

export const SCENARIO_CATALOG: readonly ScenarioDefinition[] = MOCK_SCENARIOS.map(getScenarioDefinition)
