import { z } from 'zod'

export const createCategorieSchema = z.object({
  nom: z.string().min(1).max(200),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
})

export const updateCategorieSchema = createCategorieSchema.partial()

export const createArticleSchema = z.object({
  reference: z.string().min(1).max(50),
  nom: z.string().min(1).max(200),
  categorieId: z.string().uuid().optional(),
  unite: z.string().default('pièce'),
  prixUnitaire: z.number().positive().optional(),
  seuilAlerte: z.number().int().min(0).default(5),
  emplacement: z.string().optional(),
  notes: z.string().optional(),
})

export const updateArticleSchema = createArticleSchema.partial()

export const createFournisseurSchema = z.object({
  nom: z.string().min(1).max(200),
  contact: z.string().max(200).optional(),
  telephone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  adresse: z.string().max(500).optional(),
  notes: z.string().optional(),
})

export const updateFournisseurSchema = createFournisseurSchema.partial()

export const createClientSchema = z.object({
  nom: z.string().min(1).max(200),
  type: z.enum(['entreprise', 'particulier']).default('entreprise'),
  contact: z.string().max(200).optional(),
  telephone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  adresse: z.string().max(500).optional(),
  ville: z.string().max(200).optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

export const ligneSortieSchema = z.object({
  articleId: z.string().uuid(),
  quantite: z.number().int().positive(),
})

export const annulerSortieSchema = z.object({
  motif: z.string().trim().min(3).max(500),
})

export const createSortieSchema = z.object({
  clientId: z.string().uuid(),
  dateSortie: z.string().optional(),
  objet: z.string().max(300).optional(),
  modeReglement: z.enum(['comptant', 'credit', 'mobile_money']).default('comptant'),
  statutPaiement: z.enum(['paye', 'partiel', 'impaye']).default('paye'),
  montantPaye: z.number().min(0).optional(),
  notes: z.string().optional(),
  lignes: z.array(ligneSortieSchema).min(1),
})

export const ligneCommandeSchema = z.object({
  articleId: z.string().uuid(),
  quantite: z.number().int().positive(),
  prixUnitaire: z.number().positive().optional(),
})

export const createCommandeSchema = z.object({
  fournisseurId: z.string().uuid(),
  dateCommande: z.string().optional(),
  dateLivraisonPrevue: z.string().optional(),
  notes: z.string().optional(),
  lignes: z.array(ligneCommandeSchema).min(1),
})

export const receptionSchema = z.object({
  lignes: z
    .array(
      z.object({
        ligneId: z.string().uuid(),
        quantite: z.number().int().positive(),
      }),
    )
    .min(1),
})

export const updateCommandeSchema = z.object({
  statut: z.enum(['brouillon', 'envoyee', 'partielle', 'recue', 'annulee']).optional(),
  dateCommande: z.string().optional(),
  dateLivraisonPrevue: z.string().optional(),
  notes: z.string().optional(),
  lignes: z.array(ligneCommandeSchema).min(1).optional(),
})

export const createMouvementSchema = z.object({
  articleId: z.string().uuid(),
  type: z.enum(['entree', 'sortie']),
  quantite: z.number().int().positive(),
  fournisseurId: z.string().uuid().optional(),
  bonLivraison: z.string().optional(),
  motif: z.string().optional(),
})

export const ajustementSchema = z.object({
  stockPhysique: z.number().int().min(0),
  motif: z.string().trim().min(3).max(500),
})

export const updateParametresSchema = z.object({
  utilisateurPrenom: z.string().trim().min(1).max(100),
  utilisateurNom: z.string().trim().min(1).max(100),
})

// --- Import Excel/CSV : schémas dédiés (entrées = chaînes, coercition) ---

const texte = z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.string().min(1))
const texteOpt = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().optional(),
)
const entierOpt = (def: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? def : v),
    z.coerce.number().int().min(0),
  )
const decimalOpt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().positive().optional(),
)

export const importArticleSchema = z.object({
  reference: texte,
  nom: texte,
  categorie: texteOpt,
  unite: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : 'pièce'),
    z.string(),
  ),
  prixUnitaire: decimalOpt,
  stockActuel: entierOpt(0),
  seuilAlerte: entierOpt(5),
  emplacement: texteOpt,
  notes: texteOpt,
})

export const importCategorieSchema = z.object({
  nom: texte,
  description: texteOpt,
  parent: texteOpt,
})

export const importFournisseurSchema = z.object({
  nom: texte,
  contact: texteOpt,
  telephone: texteOpt,
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().email().optional(),
  ),
  adresse: texteOpt,
  notes: texteOpt,
})

export const importClientSchema = z.object({
  nom: texte,
  type: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : 'entreprise'),
    z.enum(['entreprise', 'particulier']),
  ),
  contact: texteOpt,
  telephone: texteOpt,
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().email().optional(),
  ),
  adresse: texteOpt,
  ville: texteOpt,
  notes: texteOpt,
})
