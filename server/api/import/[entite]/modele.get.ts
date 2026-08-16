import {
  ENTITES_IMPORT_AVEC_TOUS,
  configModele,
  genererModeleTous,
  type EntiteImportOuTous,
} from '../../../utils/import'

function champCsv(v: string): string {
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export default defineEventHandler(async (event) => {
  const entite = getRouterParam(event, 'entite') as EntiteImportOuTous
  if (!ENTITES_IMPORT_AVEC_TOUS.includes(entite)) {
    throw createError({ statusCode: 400, message: `Entité inconnue : ${entite}` })
  }

  if (entite === 'tous') {
    const buffer = await genererModeleTous()
    setResponseHeaders(event, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="modele-tous.xlsx"`,
    })
    return buffer
  }

  const { entetes, exemple } = configModele(entite)
  const csv = '﻿' + [entetes.join(';'), exemple.map(champCsv).join(';')].join('\r\n')

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="modele-${entite}.csv"`,
  })
  return csv
})
