export function generateId(): string {
  return crypto.randomUUID()
}

export function generateCommandeReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CMD-${date}-${suffix}`
}
