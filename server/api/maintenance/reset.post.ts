import { db } from '../../db'
import {
  retours,
  reglements,
  lignesSortie,
  lignesCommande,
  mouvements,
  sorties,
  commandes,
  articles,
  chantiers,
  beneficiaires,
  clients,
  fournisseurs,
  categories,
} from '../../db/schema'
import { creerSauvegarde, dossierSauvegardes } from '../../utils/sauvegardes'

/**
 * Efface toutes les données métier : catalogue, stock, clients, ventes,
 * règlements, retours, chantiers, bénéficiaires et commandes. Conserve les
 * paramètres (identité et coordonnées de l'entreprise). Une copie de la base
 * est faite juste avant : un effacement se rattrape par une restauration.
 */
export default defineEventHandler(async (event) => {
  if (dossierSauvegardes) await creerSauvegarde('avant-effacement')

  await db.transaction(async (tx) => {
    // Ordre dépendances : enfants avant parents.
    await tx.delete(retours)
    await tx.delete(reglements)
    await tx.delete(lignesSortie)
    await tx.delete(lignesCommande)
    await tx.delete(mouvements)
    await tx.delete(sorties)
    await tx.delete(commandes)
    await tx.delete(articles)
    await tx.delete(chantiers)
    await tx.delete(beneficiaires)
    await tx.delete(clients)
    await tx.delete(fournisseurs)
    await tx.delete(categories)
  })

  setResponseStatus(event, 200)
  return { success: true }
})
