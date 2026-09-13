import { eq } from 'drizzle-orm'
import { db } from '../db'
import { parametres } from '../db/schema'

// Une seule ligne `app`. Tant qu'elle n'existe pas, chaque champ retombe sur
// sa valeur par défaut : c'est l'état d'une installation neuve.
export async function lireParametres() {
  const [row] = await db.select().from(parametres).where(eq(parametres.id, 'app'))
  return {
    nomEntreprise: row?.nomEntreprise ?? null,
    regimeTva: row?.regimeTva ?? 'non_assujetti',
    tauxTva: row?.tauxTva ?? 18,
    adresse: row?.adresse ?? null,
    ville: row?.ville ?? null,
    boitePostale: row?.boitePostale ?? null,
    telephone: row?.telephone ?? null,
    ncc: row?.ncc ?? null,
    rccm: row?.rccm ?? null,
  }
}
