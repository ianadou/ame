// Le tracing Nitro copie @libsql de façon INCOMPLÈTE :
//  - paquets JS dont des fichiers de condition d'export sont omis
//    (isomorphic-ws sans web.mjs ciblé par la condition « bun », etc.) ;
//  - SURTOUT, le binding NATIF de `libsql` (`require()` dynamique selon
//    process.platform) n'est pas résolu : sur Windows le serveur Nitro
//    plante au démarrage (« Cannot find module '@libsql/win32-x64-msvc' »)
//    → rien n'écoute → « 127.0.0.1 a refusé de se connecter ».
//
// On recopie donc ENTIERS, depuis node_modules vers .output : le paquet
// natif `libsql`, et TOUS les sous-paquets `@libsql/*` présents (le binding
// de plateforme installé dépend de l'OS du build — Windows en CI). Écrase
// pour garantir tous les fichiers (force).
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const serverDir = resolve(root, '.output/server')

if (!existsSync(serverDir)) {
  console.error('postbuild-libsql: .output/server introuvable (lancer le build avant)')
  process.exit(1)
}

let n = 0

// 1) Tous les sous-paquets @libsql/* (client, core, hrana-client,
//    isomorphic-*, ET le binding natif @libsql/<plateforme>).
const scopeSrc = resolve(root, 'node_modules/@libsql')
const scopeDst = resolve(serverDir, 'node_modules/@libsql')
if (existsSync(scopeSrc)) {
  mkdirSync(scopeDst, { recursive: true })
  for (const pkg of readdirSync(scopeSrc)) {
    cpSync(resolve(scopeSrc, pkg), resolve(scopeDst, pkg), { recursive: true, force: true })
    n++
  }
}

// 2) Le paquet natif `libsql` lui-même (chargeur du binding ci-dessus).
const libsqlSrc = resolve(root, 'node_modules/libsql')
if (existsSync(libsqlSrc)) {
  cpSync(libsqlSrc, resolve(serverDir, 'node_modules/libsql'), { recursive: true, force: true })
  n++
}

console.log(`postbuild-libsql: ${n} paquet(s) libsql recopié(s) (complets) vers .output`)
