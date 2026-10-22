/**
 * Hash simulado para as credenciais de demonstração.
 * Não é criptografia real: existe apenas para que nenhuma senha seja
 * persistida em texto claro no estado do mock (requisito de segurança).
 */
export function hashPassword(password: string, salt: string): string {
  const input = `${salt}:${password}`
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `sim$${hash.toString(16).padStart(8, '0')}`
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  return hashPassword(password, salt) === expectedHash
}
