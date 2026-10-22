import { ApiError } from '@/lib/api-error'
import { NETWORK_IDS, type NetworkId } from '@/modules/nft/domain/nft.contracts'

export function fail(code: ConstructorParameters<typeof ApiError>[0]['code'], status: number, message?: string): never {
  throw new ApiError({ code, message }, status)
}

export function invalid(field: string, message: string): never {
  throw new ApiError({ code: 'VALIDATION_ERROR', details: [{ field, message }] }, 422)
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('body', 'Envie um objeto JSON.')
  return value as Record<string, unknown>
}

export function text(value: unknown, field: string, min = 1, max = 200): string {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    invalid(field, `Informe de ${min} a ${max} caracteres.`)
  }
  return value.trim()
}

export function email(value: unknown): string {
  const result = text(value, 'email', 3, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(result)) invalid('email', 'Informe um e-mail válido.')
  return result
}

export function quantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) invalid('quantity', 'Informe uma quantidade inteira positiva.')
  return value
}

export function network(value: unknown): NetworkId {
  if (!(NETWORK_IDS as readonly unknown[]).includes(value)) invalid('network', 'Rede inválida.')
  return value as NetworkId
}

export function lines(value: unknown): { nftId: string; quantity: number }[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) invalid('items', 'Informe de 1 a 100 itens.')
  const result = value.map((item) => {
    const line = record(item)
    return { nftId: text(line.nftId, 'nftId'), quantity: quantity(line.quantity) }
  })
  if (new Set(result.map((item) => item.nftId)).size !== result.length) invalid('items', 'Agrupe as quantidades de NFTs repetidos.')
  return result.sort((a, b) => a.nftId.localeCompare(b.nftId))
}

export function couponCode(value: unknown): string | null {
  return value == null || value === '' ? null : text(value, 'couponCode', 1, 30).toUpperCase()
}

export function ensName(value: unknown): string {
  const result = text(value, "ensName", 0, 100)
  if (result && !/^[a-zA-Z0-9-]+\.(eth|sol|polygon)$/.test(result)) invalid("ensName", "Informe um nome ENS válido, como nome.eth.")
  return result
}
