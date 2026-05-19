import { ENTITES_IMPORT, MAX_TAILLE, traiterImport, type EntiteImport } from '../../utils/import'

export default defineEventHandler(async (event) => {
  const entite = getRouterParam(event, 'entite') as EntiteImport
  if (!ENTITES_IMPORT.includes(entite)) {
    throw createError({ statusCode: 400, message: `Entité inconnue : ${entite}` })
  }

  const form = await readMultipartFormData(event)
  const fichier = form?.find((p) => p.name === 'file' && p.filename)
  if (!fichier || !fichier.filename) {
    throw createError({ statusCode: 400, message: 'Aucun fichier fourni (champ « file »)' })
  }

  const ext = fichier.filename.toLowerCase().split('.').pop()
  if (ext !== 'csv' && ext !== 'xlsx') {
    throw createError({ statusCode: 400, message: 'Format non supporté (utiliser .csv ou .xlsx)' })
  }
  if (fichier.data.length > MAX_TAILLE) {
    throw createError({ statusCode: 400, message: 'Fichier trop volumineux (max 5 Mo)' })
  }

  const dryRun = getQuery(event).dryRun === '1'
  return traiterImport(entite, fichier.data, fichier.filename, dryRun)
})
