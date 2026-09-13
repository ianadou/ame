import { restaurerSauvegarde } from '../../../utils/sauvegardes'

export default defineEventHandler(async (event) => {
  await restaurerSauvegarde(getRouterParam(event, 'nom')!)
  return { success: true }
})
