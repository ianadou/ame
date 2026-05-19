import { ENTITES_EXPORT, exporter, type EntiteExport } from '../../utils/export'

export default defineEventHandler(async (event) => {
  const entite = getRouterParam(event, 'entite') as EntiteExport
  if (!ENTITES_EXPORT.includes(entite)) {
    throw createError({ statusCode: 400, message: `Entité inconnue : ${entite}` })
  }

  const q = getQuery(event)
  const format = q.format === 'xlsx' ? 'xlsx' : 'csv'

  const { corps, type, filename } = await exporter(entite, format, {
    categorie: (q.categorie as string) || undefined,
    type: (q.type as string) || undefined,
  })

  setResponseHeaders(event, {
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${filename}"`,
  })
  return corps
})
