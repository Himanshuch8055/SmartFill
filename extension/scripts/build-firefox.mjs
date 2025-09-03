#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'dist-firefox');

if (!fs.existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

// Clean output dir
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Copy all files from dist to dist-firefox
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
copyRecursive(dist, outDir);

// Load manifest and adapt background for Firefox (no MV3 service_worker yet in validator)
const manifestPath = path.join(outDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.background) {
  // Remove module type if present
  if (manifest.background.type) delete manifest.background.type;
  // Replace service_worker with background.scripts for Firefox
  if (manifest.background.service_worker) {
    manifest.background = {
      scripts: [manifest.background.service_worker]
    };
  }
}

// Find the background asset filename under assets/
const assetsDir = path.join(outDir, 'assets');
const bgAsset = fs.readdirSync(assetsDir).find(f => /^background\.js-.*\.js$/.test(f));
if (!bgAsset) {
  console.error('Could not find background asset in assets/.');
  process.exit(1);
}

// Overwrite the service worker loader with non-module importScripts version
const swLoaderPath = path.join(outDir, 'service-worker-loader.js');
const relativeAsset = `./assets/${bgAsset}`;
const swCode = `self.importScripts('${relativeAsset}');\n`;
fs.writeFileSync(swLoaderPath, swCode, 'utf8');

// Write back manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log('Prepared Firefox-friendly build at dist-firefox/.');

// Zip it one level up as smartfill-firefox.zip
try {
  execSync(`cd ${outDir} && zip -r ../smartfill-firefox.zip .`, { stdio: 'inherit', shell: '/bin/zsh' });
  console.log('Created zip: smartfill-firefox.zip');
} catch (e) {
  console.error('Failed to zip:', e.message);
  process.exit(1);
}
