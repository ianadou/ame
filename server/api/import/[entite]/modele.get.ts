import { ENTITES_IMPORT, configModele, type EntiteImport } from '../../../utils/import'

function champCsv(v: string): string {
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export default defineEventHandler((event) => {
  const entite = getRouterParam(event, 'entite') as EntiteImport
  if (!ENTITES_IMPORT.includes(entite)) {
    throw createError({ statusCode: 400, message: `Entité inconnue : ${entite}` })
  }

  const { entetes, exemple } = configModele(entite)
  const csv = '﻿' + [entetes.join(';'), exemple.map(champCsv).join(';')].join('\r\n')

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="modele-${entite}.csv"`,
  })
  return csv
})
