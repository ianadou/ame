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

export const createChantierSchema = z.object({
  nom: z.string().min(1).max(200),
  adresse: z.string().max(500).optional(),
  statut: z.enum(['en_cours', 'termine', 'en_pause']).default('en_cours'),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  notes: z.string().optional(),
})

export const updateChantierSchema = createChantierSchema.partial()

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

export const updateCommandeSchema = z.object({
  statut: z.enum(['brouillon', 'envoyee', 'recue', 'annulee']).optional(),
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
  chantierId: z.string().uuid().optional(),
  bonLivraison: z.string().optional(),
  motif: z.string().optional(),
})
