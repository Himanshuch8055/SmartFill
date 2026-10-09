#!/usr/bin/env node
// Creates store-ready zips in release/:
//   smartfill-chrome-<version>.zip   (upload to Chrome Web Store)
//   smartfill-firefox-<version>.zip  (upload to Firefox Add-ons)
//   smartfill-source-<version>.zip   (source code AMO asks for, since the build is minified)
// Run via `npm run package`, which builds both targets first.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'manifest.json'), 'utf8'))
const outDir = path.join(root, 'release')
fs.mkdirSync(outDir, { recursive: true })

function zip(name, addEntries) {
  const file = path.join(outDir, name)
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(file)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', () => {
      console.log(`${name}  ${(archive.pointer() / 1024).toFixed(1)} KB`)
      resolve()
    })
    archive.on('error', reject)
    archive.pipe(output)
    addEntries(archive)
    archive.finalize()
  })
}

const SOURCE_IGNORE = ['node_modules/**', 'dist/**', 'dist-firefox/**', 'release/**', '**/*.zip', '.env*']

await zip(`smartfill-chrome-${version}.zip`, (a) => a.directory(path.join(root, 'dist'), false))
await zip(`smartfill-firefox-${version}.zip`, (a) => a.directory(path.join(root, 'dist-firefox'), false))
await zip(`smartfill-source-${version}.zip`, (a) => a.glob('**/*', { cwd: root, ignore: SOURCE_IGNORE, dot: false }))
console.log(`Packages written to ${path.relative(process.cwd(), outDir) || '.'}`)
