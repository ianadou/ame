import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { sorties, clients, lignesSortie, articles } from '../../db/schema'

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
      dateSortie: sorties.dateSortie,
      objet: sorties.objet,
      montantTotal: sorties.montantTotal,
      montantPaye: sorties.montantPaye,
      modeReglement: sorties.modeReglement,
      statutPaiement: sorties.statutPaiement,
      notes: sorties.notes,
      createdAt: sorties.createdAt,
    })
    .from(sorties)
    .innerJoin(clients, eq(sorties.clientId, clients.id))
    .where(eq(sorties.id, id))

  if (!sortie) {
    throw createError({ statusCode: 404, message: 'Bon de sortie introuvable' })
  }

  const lignes = await db
    .select({
      id: lignesSortie.id,
      articleId: lignesSortie.articleId,
      articleReference: articles.reference,
      articleNom: articles.nom,
      unite: articles.unite,
      quantite: lignesSortie.quantite,
      prixUnitaire: lignesSortie.prixUnitaire,
      stockApres: lignesSortie.stockApres,
    })
    .from(lignesSortie)
    .innerJoin(articles, eq(lignesSortie.articleId, articles.id))
    .where(eq(lignesSortie.sortieId, id))
    .orderBy(articles.nom)

  return { ...sortie, lignes }
})
