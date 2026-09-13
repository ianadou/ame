import { creerSauvegarde } from '../../utils/sauvegardes'

export default defineEventHandler(async (event) => {
  const sauvegarde = await creerSauvegarde('manuelle')
  setResponseStatus(event, 201)
  return sauvegarde
})
