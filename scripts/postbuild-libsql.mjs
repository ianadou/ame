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
//
// Windows seulement : le `.node` libsql dépend du runtime MSVC
// (vcruntime140.dll, msvcp140.dll, vcruntime140_1.dll). Sur une machine
// SANS « Visual C++ Redistributable » installé, LoadLibrary échoue avec
// « ERR_DLOPEN_FAILED : Le module spécifié est introuvable » → on copie
// ces DLL depuis System32 du runner CI à côté du `.node` pour rendre
// l'app autonome (Windows charge les DLL adjacentes au binaire en
// premier, donc pas besoin d'admin / vc_redist côté utilisateur).
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

// 3) Windows : DLL runtime MSVC à côté du .node natif.
if (process.platform === 'win32') {
  const msvcDlls = ['vcruntime140.dll', 'vcruntime140_1.dll', 'msvcp140.dll']
  const system32 = resolve(process.env.SystemRoot || 'C:\\Windows', 'System32')
  const nodeBindingDir = resolve(scopeDst, 'win32-x64-msvc')
  if (existsSync(nodeBindingDir)) {
    let dllCount = 0
    for (const dll of msvcDlls) {
      const src = resolve(system32, dll)
      if (existsSync(src)) {
        cpSync(src, resolve(nodeBindingDir, dll), { force: true })
        dllCount++
      } else {
        console.warn(`postbuild-libsql: ${dll} introuvable dans ${system32}`)
      }
    }
    console.log(`postbuild-libsql: ${dllCount} DLL MSVC bundlée(s) à côté du .node libsql`)
  } else {
    console.warn(`postbuild-libsql: dossier ${nodeBindingDir} absent (binding Windows non installé)`)
  }
}

console.log(`postbuild-libsql: ${n} paquet(s) libsql recopié(s) (complets) vers .output`)
