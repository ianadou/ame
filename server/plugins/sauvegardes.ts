import { sauvegardeQuotidienneSiBesoin } from '../utils/sauvegardes'

const UNE_HEURE = 60 * 60 * 1000

// L'app peut rester ouverte plusieurs jours : la copie quotidienne ne dépend
// donc pas du seul démarrage. Mode packagé uniquement, comme les migrations ;
// la copie du démarrage est faite par le plugin de migration, après celles-ci.
export default defineNitroPlugin(() => {
  if (!process.env.AME_MIGRATIONS_DIR) return

  setInterval(() => {
    sauvegardeQuotidienneSiBesoin().catch((e) =>
      console.error('sauvegarde: échec de la copie quotidienne', e),
    )
  }, UNE_HEURE).unref()
})
