export type RegimeTva = 'assujetti' | 'non_assujetti'

export interface CoordonneesEntreprise {
  adresse: string | null
  ville: string | null
  boitePostale: string | null
  telephone: string | null
  ncc: string | null
  rccm: string | null
}

export interface SessionUser extends CoordonneesEntreprise {
  nomEntreprise: string | null
  regimeTva: RegimeTva
  tauxTva: number
}

// Identité de l'entreprise, coordonnées imprimées sur les bons et
// configuration fiscale, partagées entre la modal de premier lancement, la
// sidebar, le footer, les documents imprimables et les composants d'édition
// rapide (dashboard + page réglages).
export function useSessionUser() {
  const user = useState<SessionUser>('session-user', () => ({
    nomEntreprise: null,
    regimeTva: 'non_assujetti',
    tauxTva: 18,
    adresse: null,
    ville: null,
    boitePostale: null,
    telephone: null,
    ncc: null,
    rccm: null,
  }))
  const editing = useState<boolean>('session-user-editing', () => false)
  // Tant que `load()` n'a pas répondu, on ne sait pas si l'entreprise est
  // configurée : `configured` vaut faux par défaut, ce qui ferait clignoter
  // la modale de premier lancement à chaque navigation. Les consommateurs
  // attendent ce drapeau avant de conclure quoi que ce soit.
  const loaded = useState<boolean>('session-user-loaded', () => false)

  const configured = computed(() => !!user.value.nomEntreprise)
  const assujettiTva = computed(() => user.value.regimeTva === 'assujetti')

  async function load() {
    try {
      user.value = await $fetch<SessionUser>('/api/parametres')
    } finally {
      // Même en échec (table absente, serveur non prêt) l'état est résolu :
      // la modale bloquante doit alors bien prendre le relais.
      loaded.value = true
    }
  }

  async function enregistrer(champs: Partial<SessionUser>) {
    user.value = await $fetch<SessionUser>('/api/parametres', {
      method: 'PUT',
      body: champs,
    })
  }

  async function save(nomEntreprise: string) {
    await enregistrer({ nomEntreprise })
    editing.value = false
  }

  async function saveRegimeTva(regimeTva: RegimeTva, tauxTva: number) {
    await enregistrer({ regimeTva, tauxTva })
  }

  async function saveCoordonnees(coordonnees: CoordonneesEntreprise) {
    await enregistrer(coordonnees)
  }

  return {
    user,
    editing,
    loaded,
    configured,
    assujettiTva,
    load,
    save,
    saveRegimeTva,
    saveCoordonnees,
  }
}
