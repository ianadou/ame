export interface SessionUser {
  nomEntreprise: string | null
}

// Identité de l'entreprise utilisée pour la signature du footer et l'avatar
// sidebar (mono-poste, Phase 1). État partagé entre la modal de saisie au
// premier lancement et les composants d'affichage via useState.
export function useSessionUser() {
  const user = useState<SessionUser>('session-user', () => ({ nomEntreprise: null }))
  const editing = useState<boolean>('session-user-editing', () => false)

  const configured = computed(() => !!user.value.nomEntreprise)

  async function load() {
    user.value = await $fetch<SessionUser>('/api/parametres')
  }

  async function save(nomEntreprise: string) {
    user.value = await $fetch<SessionUser>('/api/parametres', {
      method: 'PUT',
      body: { nomEntreprise },
    })
    editing.value = false
  }

  return { user, editing, configured, load, save }
}
