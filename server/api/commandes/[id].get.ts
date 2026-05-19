import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { commandes, fournisseurs, lignesCommande, articles } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [commande] = await db
    .select({
      id: commandes.id,
      reference: commandes.reference,
      fournisseurId: commandes.fournisseurId,
      fournisseurNom: fournisseurs.nom,
      statut: commandes.statut,
      dateCommande: commandes.dateCommande,
      dateLivraisonPrevue: commandes.dateLivraisonPrevue,
      notes: commandes.notes,
      createdAt: commandes.createdAt,
    })
    .from(commandes)
    .leftJoin(fournisseurs, eq(commandes.fournisseurId, fournisseurs.id))
    .where(eq(commandes.id, id))

  if (!commande) {
    throw createError({ statusCode: 404, message: 'Commande introuvable' })
  }

  const lignes = await db
    .select({
      id: lignesCommande.id,
      articleId: lignesCommande.articleId,
      reference: articles.reference,
      nom: articles.nom,
      unite: articles.unite,
      quantite: lignesCommande.quantite,
      quantiteRecue: lignesCommande.quantiteRecue,
      prixUnitaire: lignesCommande.prixUnitaire,
    })
    .from(lignesCommande)
    .innerJoin(articles, eq(lignesCommande.articleId, articles.id))
    .where(eq(lignesCommande.commandeId, id))
    .orderBy(articles.nom)

  const total = lignes.reduce((sum, ligne) => sum + ligne.quantite * (ligne.prixUnitaire ?? 0), 0)

  return { ...commande, lignes, total }
})
