import { db } from '~/server/db'
import { categories } from '~/server/db/schema'

export default defineEventHandler(async () => {
  const allCategories = await db.select().from(categories).orderBy(categories.nom)

  const roots = allCategories.filter((c) => !c.parentId)
  return roots.map((root) => ({
    ...root,
    children: allCategories.filter((c) => c.parentId === root.id),
  }))
})
