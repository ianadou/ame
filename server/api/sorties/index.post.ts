import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  sorties,
  lignesSortie,
  clients,
  chantiers,
  beneficiaires,
  articles,
  mouvements,
  reglements,
  parametres,
} from '../../db/schema'
import { createSortieSchema } from '../../utils/validation'
import { generateId, generateSortieReference } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createSortieSchema.parse)

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, body.clientId))
  if (!client) {
    throw createError({ statusCode: 404, message: 'Client introuvable' })
  }

  // Destination et bénéficiaire sont optionnels, mais s'ils sont fournis
  // ils doivent exister, sinon le bon partirait avec une référence morte.
  if (body.chantierId) {
    const [chantier] = await db
      .select({ id: chantiers.id })
      .from(chantiers)
      .where(eq(chantiers.id, body.chantierId))
    if (!chantier) {
      throw createError({ statusCode: 404, message: 'Chantier introuvable' })
    }
  }

  if (body.beneficiaireId) {
    const [beneficiaire] = await db
      .select({ id: beneficiaires.id })
      .from(beneficiaires)
      .where(eq(beneficiaires.id, body.beneficiaireId))
    if (!beneficiaire) {
      throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
    }
  }

  // Fusionne les lignes en double (même article) : un bon de sortie a une
  // ligne par article, et la vérification de stock doit être cumulée.
  const quantitesParArticle = new Map<string, number>()
  for (const ligne of body.lignes) {
    quantitesParArticle.set(
      ligne.articleId,
      (quantitesParArticle.get(ligne.articleId) ?? 0) + ligne.quantite,
    )
  }
  const articleIds = [...quantitesParArticle.keys()]

  const articlesData = await db.select().from(articles).where(inArray(articles.id, articleIds))

  if (articlesData.length !== articleIds.length) {
    throw createError({ statusCode: 404, message: 'Un ou plusieurs articles sont introuvables' })
  }

  // Vérifie le stock AVANT toute écriture (échec atomique).
  for (const article of articlesData) {
    const demande = quantitesParArticle.get(article.id)!
    if (article.stockActuel < demande) {
      throw createError({
        statusCode: 400,
        message: `Stock insuffisant pour « ${article.nom} » (${article.stockActuel} disponible, ${demande} demandé)`,
      })
    }
  }

  // Fige le taux TVA appliqué selon le régime actuel : on stocke `null`
  // pour les utilisateurs non assujettis (les bons n'afficheront aucune
  // mention TVA), sinon le taux courant. Les anciens bons restent
  // affichés avec leur taux d'origine même si le régime change ensuite.
  const [param] = await db.select().from(parametres).where(eq(parametres.id, 'app'))
  const tauxTvaApplique = param?.regimeTva === 'assujetti' ? (param?.tauxTva ?? 18) : null

  const sortieId = generateId()
  const reference = generateSortieReference()

  // Prix figé au moment de la sortie + stock restant figé par ligne.
  const stockSuivi = new Map(articlesData.map((a) => [a.id, a.stockActuel]))
  const prixParArticle = new Map(articlesData.map((a) => [a.id, a.prixUnitaire ?? 0]))

  const lignes = [...quantitesParArticle.entries()].map(([articleId, quantite]) => {
    const stockApres = stockSuivi.get(articleId)! - quantite
    stockSuivi.set(articleId, stockApres)
    return {
      id: generateId(),
      sortieId,
      articleId,
      quantite,
      prixUnitaire: prixParArticle.get(articleId)!,
      stockApres,
    }
  })

  const montantTotal = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)

  // L'acompte éventuellement encaissé à l'émission devient un règlement à part
  // entière : le statut du bon découle toujours d'une trace, jamais d'une
  // simple déclaration.
  const acompte =
    body.statutPaiement === 'paye'
      ? montantTotal
      : body.statutPaiement === 'impaye'
        ? 0
        : Math.min(body.montantPaye ?? 0, montantTotal)

  const reglementInitial =
    acompte > 0
      ? {
          id: generateId(),
          sortieId,
          montant: acompte,
          dateReglement: body.dateSortie ?? new Date().toISOString().slice(0, 10),
          mode: body.modeReglement === 'mobile_money' ? 'mobile_money' : 'especes',
          notes: "Encaissé à l'émission du bon",
        }
      : null

  const sortie = {
    id: sortieId,
    reference,
    clientId: body.clientId,
    chantierId: body.chantierId ?? null,
    beneficiaireId: body.beneficiaireId ?? null,
    dateSortie: body.dateSortie ?? new Date().toISOString().slice(0, 10),
    dateEcheance: body.dateEcheance ?? null,
    objet: body.objet ?? null,
    montantTotal,
    modeReglement: body.modeReglement,
    statutPaiement: acompte <= 0 ? 'impaye' : acompte >= montantTotal ? 'paye' : 'partiel',
    montantPaye: acompte,
    notes: body.notes ?? null,
    tauxTvaApplique,
  }

  await db.transaction(async (tx) => {
    await tx.insert(sorties).values(sortie)
    await tx.insert(lignesSortie).values(lignes)
    if (reglementInitial) await tx.insert(reglements).values(reglementInitial)

    for (const ligne of lignes) {
      await tx
        .update(articles)
        .set({
          stockActuel: sql`${articles.stockActuel} - ${ligne.quantite}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(articles.id, ligne.articleId))

      await tx.insert(mouvements).values({
        id: generateId(),
        articleId: ligne.articleId,
        type: 'sortie',
        quantite: ligne.quantite,
        sortieId,
        motif: `Bon de sortie ${reference}`,
      })
    }
  })

  setResponseStatus(event, 201)
  return { ...sortie, lignes }
})
