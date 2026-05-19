import { db } from '../../db'
import {
  lignesSortie,
  lignesCommande,
  mouvements,
  sorties,
  commandes,
  articles,
  clients,
  fournisseurs,
  categories,
} from '../../db/schema'

/**
 * Efface toutes les données métier (catégories, articles, stock, clients,
 * sorties, commandes, mouvements). Conserve les paramètres (identité
 * utilisateur). Sert à repartir d'une base propre après avoir exploré les
 * données d'exemple.
 */
export default defineEventHandler(async (event) => {
  await db.transaction(async (tx) => {
    // Ordre dépendances : enfants avant parents.
    await tx.delete(lignesSortie)
    await tx.delete(lignesCommande)
    await tx.delete(mouvements)
    await tx.delete(sorties)
    await tx.delete(commandes)
    await tx.delete(articles)
    await tx.delete(clients)
    await tx.delete(fournisseurs)
    await tx.delete(categories)
  })

  setResponseStatus(event, 200)
  return { success: true }
})
