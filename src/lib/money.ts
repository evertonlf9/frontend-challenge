/**
 * Aritmética decimal para valores em ETH.
 * Valores trafegam como string; os cálculos usam BigInt escalado (18 casas)
 * para preservar precisão e evitar erros de ponto flutuante.
 */
const SCALE = 10n ** 18n
const SCALE_DIGITS = 18

function parse(value: string): bigint {
  const normalized = value.trim()
  if (!/^-?\d+(\.\d{1,18})?$/.test(normalized)) {
    throw new Error('Valor ETH inválido: use uma string decimal com até 18 casas.')
  }
  const negative = normalized.startsWith('-')
  const unsigned = negative ? normalized.slice(1) : normalized
  const [whole = '0', fraction = ''] = unsigned.split('.')
  const paddedFraction = `${fraction}${'0'.repeat(SCALE_DIGITS)}`.slice(0, SCALE_DIGITS)
  const scaled = BigInt(whole === '' ? '0' : whole) * SCALE + BigInt(paddedFraction)
  return negative ? -scaled : scaled
}

function serialize(scaled: bigint): string {
  const negative = scaled < 0n
  const absolute = negative ? -scaled : scaled
  const whole = absolute / SCALE
  const fraction = (absolute % SCALE).toString().padStart(SCALE_DIGITS, '0').replace(/0+$/, '')
  const value = fraction ? `${whole}.${fraction}` : `${whole}`
  return negative ? `-${value}` : value
}

export function addEth(...values: string[]): string {
  return serialize(values.reduce((total, value) => total + parse(value), 0n))
}

export function subEth(a: string, b: string): string {
  return serialize(parse(a) - parse(b))
}

export function mulEth(value: string, multiplier: string | number): string {
  const factor = parse(String(multiplier))
  return serialize((parse(value) * factor) / SCALE)
}

export function percentEth(value: string, percent: number): string {
  return serialize((parse(value) * parse(String(percent))) / (SCALE * 100n))
}

export function compareEth(a: string, b: string): number {
  const left = parse(a)
  const right = parse(b)
  return left === right ? 0 : left > right ? 1 : -1
}

export function ethToNumber(value: string): number {
  return Number(serialize(parse(value)))
}

/** Formatação para exibição: preserva precisão e remove zeros à direita. */
export function formatEth(value: string, maximumFractionDigits = 4): string {
  const scaled = parse(value)
  const negative = scaled < 0n
  const absolute = negative ? -scaled : scaled
  const whole = (absolute / SCALE).toString()
  const fraction = (absolute % SCALE).toString().padStart(SCALE_DIGITS, '0')
  const trimmed = fraction.slice(0, Math.max(0, Math.min(SCALE_DIGITS, maximumFractionDigits))).replace(/0+$/, '')
  const value_ = trimmed ? `${whole},${trimmed}` : whole
  return negative ? `-${value_}` : value_
}
