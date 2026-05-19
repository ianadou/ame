export function useExport() {
  function telecharger(
    entite: string,
    format: 'csv' | 'xlsx',
    opts: { categorie?: string; type?: string } = {},
  ) {
    const params = new URLSearchParams({ format })
    if (opts.categorie) params.set('categorie', opts.categorie)
    if (opts.type) params.set('type', opts.type)
    const a = document.createElement('a')
    a.href = `/api/export/${entite}?${params}`
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return { telecharger }
}
