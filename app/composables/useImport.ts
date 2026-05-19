export interface ErreurLigne {
  ligne: number
  champ?: string
  message: string
}

export interface RapportImport {
  entite: string
  total: number
  valides: number
  crees?: number
  maj?: number
  avertissements: string[]
  erreurs: ErreurLigne[]
  apercu?: { ligne: number; action: 'create' | 'update'; donnees: Record<string, unknown> }[]
}

export function useImport() {
  function urlModele(entite: string) {
    return `/api/import/${entite}/modele`
  }

  async function envoyer(entite: string, file: File, dryRun: boolean) {
    const body = new FormData()
    body.append('file', file)
    return $fetch<RapportImport>(`/api/import/${entite}${dryRun ? '?dryRun=1' : ''}`, {
      method: 'POST',
      body,
    })
  }

  return {
    urlModele,
    previsualiser: (entite: string, file: File) => envoyer(entite, file, true),
    appliquer: (entite: string, file: File) => envoyer(entite, file, false),
  }
}
