import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  sorties,
  clients,
  chantiers,
  beneficiaires,
  lignesSortie,
  articles,
  retours,
} from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [sortie] = await db
    .select({
      id: sorties.id,
      reference: sorties.reference,
      clientId: sorties.clientId,
      clientNom: clients.nom,
      clientTelephone: clients.telephone,
      clientVille: clients.ville,
      chantierId: sorties.chantierId,
      chantierNom: chantiers.nom,
      beneficiaireId: sorties.beneficiaireId,
      beneficiaireNom: beneficiaires.nom,
      beneficiaireFonction: beneficiaires.fonction,
      dateSortie: sorties.dateSortie,
      objet: sorties.objet,
      montantTotal: sorties.montantTotal,
      montantPaye: sorties.montantPaye,
      modeReglement: sorties.modeReglement,
      statutPaiement: sorties.statutPaiement,
      notes: sorties.notes,
      statut: sorties.statut,
      annuleLe: sorties.annuleLe,
      motifAnnulation: sorties.motifAnnulation,
      tauxTvaApplique: sorties.tauxTvaApplique,
      createdAt: sorties.createdAt,
    })
    .from(sorties)
    .innerJoin(clients, eq(sorties.clientId, clients.id))
    .leftJoin(chantiers, eq(sorties.chantierId, chantiers.id))
    .leftJoin(beneficiaires, eq(sorties.beneficiaireId, beneficiaires.id))
    .where(eq(sorties.id, id))

  if (!sortie) {
    throw createError({ statusCode: 404, message: 'Bon de sortie introuvable' })
  }

  // Cumul des retours par ligne en sous-requête corrélée : évite un
  // GROUP BY sur toute la sélection pour une jointure 1-n peu peuplée.
  const lignes = await db
    .select({
      id: lignesSortie.id,
      articleId: lignesSortie.articleId,
      articleReference: articles.reference,
      articleNom: articles.nom,
      unite: articles.unite,
      retournable: articles.retournable,
      quantite: lignesSortie.quantite,
      prixUnitaire: lignesSortie.prixUnitaire,
      stockApres: lignesSortie.stockApres,
      quantiteRetournee: sql<number>`coalesce((
        select sum(${retours.quantite}) from ${retours}
        where ${retours.ligneSortieId} = ${lignesSortie.id}
      ), 0)`,
    })
    .from(lignesSortie)
    .innerJoin(articles, eq(lignesSortie.articleId, articles.id))
    .where(eq(lignesSortie.sortieId, id))
    .orderBy(articles.nom)

  return { ...sortie, lignes }
})
