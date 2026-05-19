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

export const createMouvementSchema = z.object({
  articleId: z.string().uuid(),
  type: z.enum(['entree', 'sortie']),
  quantite: z.number().int().positive(),
  fournisseurId: z.string().uuid().optional(),
  chantierId: z.string().uuid().optional(),
  bonLivraison: z.string().optional(),
  motif: z.string().optional(),
})
