import { dossierSauvegardes, listerSauvegardes } from '../../utils/sauvegardes'

export default defineEventHandler(async () => ({
  disponible: dossierSauvegardes !== null,
  dossier: dossierSauvegardes,
  sauvegardes: await listerSauvegardes(),
}))
