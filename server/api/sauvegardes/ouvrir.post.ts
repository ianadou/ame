import { ouvrirDossierSauvegardes } from '../../utils/sauvegardes'

export default defineEventHandler(async () => {
  await ouvrirDossierSauvegardes()
  return { success: true }
})
