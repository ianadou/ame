export interface SessionUser {
  utilisateurPrenom: string | null
  utilisateurNom: string | null
}

// Identité de l'utilisateur de session (mono-poste, Phase 1). État partagé
// entre la modal de saisie (layout) et le chip de la sidebar via useState.
export function useSessionUser() {
  const user = useState<SessionUser>('session-user', () => ({
    utilisateurPrenom: null,
    utilisateurNom: null,
  }))
  const editing = useState<boolean>('session-user-editing', () => false)

  const configured = computed(() => !!user.value.utilisateurPrenom && !!user.value.utilisateurNom)

  async function load() {
    user.value = await $fetch<SessionUser>('/api/parametres')
  }

  async function save(prenom: string, nom: string) {
    user.value = await $fetch<SessionUser>('/api/parametres', {
      method: 'PUT',
      body: { utilisateurPrenom: prenom, utilisateurNom: nom },
    })
    editing.value = false
  }

  return { user, editing, configured, load, save }
}
