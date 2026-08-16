// Copie le binaire `bun` courant vers src-tauri/binaries/ sous le nom
// attendu par Tauri pour un sidecar : `bun-<target-triple>`. Le binaire
// (~95 Mo, propre à la plateforme) n'est PAS versionné, on le régénère
// avant chaque build desktop.
import { execFileSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const isWindows = process.platform === 'win32'

// Le script est lancé via `bun scripts/...` : process.execPath EST le bun
// courant (bun ou bun.exe). Fallback PATH via which/where sinon.
const execName = isWindows ? 'bun.exe' : 'bun'
const bunBin = process.execPath.endsWith(execName)
  ? process.execPath
  : execFileSync(isWindows ? 'where' : 'which', ['bun'])
      .toString()
      .split(/\r?\n/)[0]
      .trim()

if (!bunBin || !existsSync(bunBin)) {
  console.error('prepare-tauri-bun: binaire bun introuvable dans le PATH')
  process.exit(1)
}

const triple = execFileSync('rustc', ['-vV'])
  .toString()
  .split('\n')
  .find((l) => l.startsWith('host:'))
  ?.replace('host:', '')
  .trim()

if (!triple) {
  console.error('prepare-tauri-bun: target-triple Rust introuvable (rustc installé ?)')
  process.exit(1)
}

const dstDir = resolve(root, 'src-tauri/binaries')
mkdirSync(dstDir, { recursive: true })
const ext = triple.includes('windows') ? '.exe' : ''
const dst = resolve(dstDir, `bun-${triple}${ext}`)

copyFileSync(bunBin, dst)
chmodSync(dst, 0o755)
console.log(`prepare-tauri-bun: ${bunBin} -> ${dst}`)
