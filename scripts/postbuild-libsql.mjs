// Le tracing Nitro copie certains paquets @libsql de façon INCOMPLÈTE
// (ex. isomorphic-ws sans web.mjs ciblé par la condition « bun » de son
// champ exports, isomorphic-fetch absent). On recopie ces paquets ENTIERS
// depuis node_modules vers .output afin que le serveur tourne en sidecar
// Tauri (Bun). Écrase pour garantir tous les fichiers de condition.
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const srcBase = resolve(root, 'node_modules/@libsql')
const dstBase = resolve(root, '.output/server/node_modules/@libsql')
const pkgs = ['client', 'core', 'hrana-client', 'isomorphic-ws', 'isomorphic-fetch']

if (!existsSync(resolve(root, '.output/server'))) {
  console.error('postbuild-libsql: .output/server introuvable (lancer le build avant)')
  process.exit(1)
}
mkdirSync(dstBase, { recursive: true })
let n = 0
for (const p of pkgs) {
  const src = resolve(srcBase, p)
  if (!existsSync(src)) continue
  cpSync(src, resolve(dstBase, p), { recursive: true, force: true })
  n++
}
console.log(`postbuild-libsql: ${n} paquet(s) @libsql recopié(s) (complets) vers .output`)
