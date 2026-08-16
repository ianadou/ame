import {
  ENTITES_IMPORT_AVEC_TOUS,
  MAX_TAILLE,
  traiterImport,
  traiterImportTous,
  type EntiteImport,
  type EntiteImportOuTous,
} from '../../utils/import'

export default defineEventHandler(async (event) => {
  const entite = getRouterParam(event, 'entite') as EntiteImportOuTous
  if (!ENTITES_IMPORT_AVEC_TOUS.includes(entite)) {
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

  if (entite === 'tous') {
    return traiterImportTous(fichier.data, fichier.filename, dryRun)
  }
  return traiterImport(entite as EntiteImport, fichier.data, fichier.filename, dryRun)
})
