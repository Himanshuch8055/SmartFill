#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

async function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const root = path.resolve(__dirname, '..')
  const iconsDir = path.join(root, 'icons')
  const srcSvg = path.join(iconsDir, 'icon.svg')

  try {
    await import('sharp')
  } catch (e) {
    console.error('Missing devDependency: sharp. Install with: npm i -D sharp')
    process.exit(1)
  }
  const sharp = (await import('sharp')).default

  if (!fs.existsSync(srcSvg)) {
    console.error('icons/icon.svg not found. Please ensure the source SVG exists.')
    process.exit(1)
  }

  const sizes = [16, 32, 48, 64, 128, 256, 512]
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

  await Promise.all(
    sizes.map(async (size) => {
      const out = path.join(iconsDir, `icon${size}.png`)
      await sharp(srcSvg)
        .resize(size, size)
        .png({ quality: 90 })
        .toFile(out)
      console.log('Generated', path.relative(root, out))
    })
  )

  console.log('All icons generated successfully.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
