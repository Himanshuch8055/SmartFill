#!/usr/bin/env node
// Captures the store screenshots, promo tile, and website images from the dev preview.
// 1. Start the preview:  npm run dev:ui
// 2. Run:                npm run store:screenshots
// Uses Chrome's built-in headless --screenshot (no remote debugging, so it also works where
// DevTools automation is disabled by policy). Set CHROME_PATH to use a different browser.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.PREVIEW_URL || 'http://localhost:5180'

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const chrome = CANDIDATES.find((p) => fs.existsSync(p))
if (!chrome) {
  console.error('Chrome not found. Set CHROME_PATH to your Chrome or Chromium executable.')
  process.exit(1)
}

const STORE = path.join(root, 'store', 'screenshots')
const WEBSITE = path.join(root, '..', 'website', 'public', 'images')

// transparent: capture with a transparent background (website product shots)
const SHOTS = [
  { id: '1', dir: STORE, file: '1-fill-preview.png', size: [1280, 800] },
  { id: '2', dir: STORE, file: '2-popup.png', size: [1280, 800] },
  { id: '3', dir: STORE, file: '3-profiles.png', size: [1280, 800] },
  { id: '4', dir: STORE, file: '4-privacy.png', size: [1280, 800] },
  { id: 'tile', dir: STORE, file: 'promo-tile-440x280.png', size: [440, 280] },
  { id: 'web-hero', dir: WEBSITE, file: 'hero-preview.png', size: [860, 720], transparent: true },
  { id: 'web-popup', dir: WEBSITE, file: 'popup.png', size: [420, 380], transparent: true },
  { id: 'web-settings', dir: WEBSITE, file: 'settings.png', size: [880, 720], transparent: true },
  { id: 'web-hero-dark', shot: 'web-hero', theme: 'dark', dir: WEBSITE, file: 'hero-preview-dark.png', size: [860, 720], transparent: true },
  { id: 'web-popup-dark', shot: 'web-popup', theme: 'dark', dir: WEBSITE, file: 'popup-dark.png', size: [420, 380], transparent: true },
  { id: 'web-settings-dark', shot: 'web-settings', theme: 'dark', dir: WEBSITE, file: 'settings-dark.png', size: [880, 720], transparent: true },
  { id: 'og', dir: WEBSITE, file: 'og-image.png', size: [1200, 630] },
]

// Only capture some shots: npm run store:screenshots -- web-hero og
const only = process.argv.slice(2)
const selected = only.length ? SHOTS.filter((s) => only.includes(s.id)) : SHOTS

try {
  await fetch(`${BASE}/dev/store.html`)
} catch {
  console.error(`Could not reach ${BASE}. Start the preview first with "npm run dev:ui".`)
  process.exit(1)
}

for (const s of selected) {
  fs.mkdirSync(s.dir, { recursive: true })
  const out = path.join(s.dir, s.file)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'smartfill-shot-'))
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--force-color-profile=srgb',
    ...(s.transparent ? ['--default-background-color=00000000'] : []),
    `--user-data-dir=${profile}`,
    `--window-size=${s.size[0]},${s.size[1]}`,
    '--virtual-time-budget=6000', // let frames load data and the preview overlay appear
    `--screenshot=${out}`,
    `${BASE}/dev/store.html?shot=${s.shot || s.id}${s.theme ? `&theme=${s.theme}` : ''}`,
  ], { stdio: 'ignore', timeout: 60000 })
  fs.rmSync(profile, { recursive: true, force: true })
  console.log('saved', path.relative(path.join(root, '..'), out))
}
