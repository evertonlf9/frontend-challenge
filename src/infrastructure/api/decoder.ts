import { ApiError } from '@/lib/api-error'

export type Decoder<T> = (value: unknown, path?: string) => T
type Shape = Record<string, Decoder<unknown>>

function invalid(path = 'response'): never {
  // Report the field, never the received value (which may contain private data).
  throw new ApiError(
    {
      code: 'INVALID_RESPONSE',
      details: [{ field: path, message: 'Formato de resposta inválido.' }],
    },
    502
  )
}

export const string: Decoder<string> = (value, path) =>
  typeof value === 'string' ? value : invalid(path)
export const boolean: Decoder<boolean> = (value, path) =>
  typeof value === 'boolean' ? value : invalid(path)
export const identifier: Decoder<string> = (value, path) =>
  typeof value === 'string' && value.trim().length > 0 ? value : invalid(path)
export const decimal: Decoder<string> = (value, path) =>
  typeof value === 'string' && value.length <= 100 && /^\d+(\.\d{1,18})?$/.test(value)
    ? value
    : invalid(path)
export const timestamp: Decoder<string> = (value, path) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value))
    ? value
    : invalid(path)
export const resourceUrl: Decoder<string> = (value, path) => {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    value.includes('\\') ||
    [...value].some((character) => character.charCodeAt(0) <= 32)
  )
    return invalid(path)
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const url = new URL(value)
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return value
  } catch {
    /* Reject malformed URLs without exposing their content. */
  }
  return invalid(path)
}
export const imageUrl: Decoder<string> = (value, path) => {
  if (
    typeof value === 'string' &&
    value.length <= 2_000_000 &&
    /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=\s]+$/.test(value)
  )
    return value
  return resourceUrl(value, path)
}

export function integer(minimum = 0, maximum = Number.MAX_SAFE_INTEGER): Decoder<number> {
  return (value, path) =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum
      ? value
      : invalid(path)
}
export function oneOf<const T extends readonly string[]>(values: T): Decoder<T[number]> {
  return (value, path) =>
    typeof value === 'string' && values.includes(value) ? (value as T[number]) : invalid(path)
}
export function nullable<T>(decode: Decoder<T>): Decoder<T | null> {
  return (value, path) => (value === null ? null : decode(value, path))
}
export function optional<T>(decode: Decoder<T>): Decoder<T | undefined> {
  return (value, path) => (value === undefined ? undefined : decode(value, path))
}
export function array<T>(decode: Decoder<T>): Decoder<T[]> {
  return (value, path = 'response') =>
    Array.isArray(value)
      ? value.map((item, index) => decode(item, `${path}[${index}]`))
      : invalid(path)
}
export function object<const S extends Shape>(
  shape: S
): Decoder<{ [K in keyof S]: ReturnType<S[K]> }> {
  return (value, path = 'response') => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid(path)
    const source = value as Record<string, unknown>
    const result = Object.fromEntries(
      Object.entries(shape).map(([key, decode]) => [
        key,
        decode(Object.hasOwn(source, key) ? source[key] : undefined, `${path}.${key}`),
      ])
    )
    return result as { [K in keyof S]: ReturnType<S[K]> }
  }
}
export function refine<T>(decode: Decoder<T>, valid: (value: T) => boolean): Decoder<T> {
  return (value, path) => {
    const result = decode(value, path)
    return valid(result) ? result : invalid(path)
  }
}
export async function response<T>(decode: Decoder<T>, request: Promise<unknown>): Promise<T> {
  return decode(await request)
}
