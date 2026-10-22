const suffixes = ['.eth', '.sol', '.polygon'] as const

export function splitEnsName(value = '') {
  const suffix = suffixes.find((item) => value.endsWith(item)) ?? '.eth'
  return { suffix, name: value.endsWith(suffix) ? value.slice(0, -suffix.length) : value }
}
export function readEnsName(data: FormData): string {
  const name = String(data.get('ensName') ?? '').trim()
  return name ? name + String(data.get('ensSuffix') ?? '.eth') : ''
}
