import { eq, sql, and, desc } from 'drizzle-orm'
import { db } from '../../db'
import { commandes, fournisseurs, lignesCommande } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const statut = query.statut as string | undefined
  const fournisseur = query.fournisseur as string | undefined

  const conditions = []
  if (statut) conditions.push(eq(commandes.statut, statut))
  if (fournisseur) conditions.push(eq(commandes.fournisseurId, fournisseur))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const data = await db
    .select({
      id: commandes.id,
      reference: commandes.reference,
      fournisseurId: commandes.fournisseurId,
      fournisseurNom: fournisseurs.nom,
      statut: commandes.statut,
      dateCommande: commandes.dateCommande,
      dateLivraisonPrevue: commandes.dateLivraisonPrevue,
      createdAt: commandes.createdAt,
      total: sql<number>`coalesce(sum(${lignesCommande.quantite} * coalesce(${lignesCommande.prixUnitaire}, 0)), 0)`,
    })
    .from(commandes)
    .leftJoin(fournisseurs, eq(commandes.fournisseurId, fournisseurs.id))
    .leftJoin(lignesCommande, eq(lignesCommande.commandeId, commandes.id))
    .where(where)
    .groupBy(commandes.id)
    .orderBy(desc(commandes.createdAt))

  return data
})
