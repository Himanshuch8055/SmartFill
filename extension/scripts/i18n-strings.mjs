// Lists every string passed to t(), tn() or mark() in src/. Used by test/i18n.test.js and to find
// strings that still need a translation:  node scripts/i18n-strings.mjs --missing hi
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const SKIP = new Set(['locales', 'dev'])
const LITERAL = String.raw`'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"`
const CALL = new RegExp(String.raw`\b(?:t|mark)\(\s*(?:${LITERAL})`, 'g')
const PLURAL = new RegExp(String.raw`\btn\([^,]+,\s*(?:${LITERAL})\s*,\s*(?:${LITERAL})`, 'g')

const unescape = (s) => s.replace(/\\(.)/g, '$1')

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return SKIP.has(name) ? [] : files(p)
    return /\.(js|jsx)$/.test(name) ? [p] : []
  })
}

export function extractStrings() {
  const found = new Set()
  for (const file of files(SRC)) {
    const code = readFileSync(file, 'utf8')
    for (const m of code.matchAll(CALL)) found.add(unescape(m[1] ?? m[2]))
    for (const m of code.matchAll(PLURAL)) {
      found.add(unescape(m[1] ?? m[2]))
      found.add(unescape(m[3] ?? m[4]))
    }
  }
  return [...found].sort()
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const strings = extractStrings()
  const i = process.argv.indexOf('--missing')
  if (i > 0) {
    const dict = (await import(pathToFileURL(join(SRC, 'locales', `${process.argv[i + 1]}.js`)).href)).default
    for (const s of strings) if (!(s in dict)) console.log(JSON.stringify(s))
  } else {
    for (const s of strings) console.log(JSON.stringify(s))
  }
}
