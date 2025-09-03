# SmartFill – Source Build Guide (for AMO Review)

This README provides everything needed to reproduce the exact Firefox add-on build from source.

## Overview
- Tech stack: Vite + React, MV3 background (post-processed for AMO).
- No external backend/services. All data is stored locally via extension storage APIs.
- Firefox package is produced by a post-build script that adapts the background to pass AMO validation.

## System Requirements
- OS: macOS, Linux, or Windows
- Node.js: 18.x or newer (tested on Node 18)
- npm: 9.x or newer

## Dependencies and Tools
- Build tool: Vite
- CSS tooling: TailwindCSS + PostCSS (via Vite)
- Image tooling for icons: `sharp` (used by `scripts/gen-icons.mjs` if needed)

All required npm packages are declared in `package.json`.

## Clean Build Steps (Exact Reproduction)

1) Install dependencies
```
npm ci
```

2) Build the production extension (Chrome-style MV3)
```
npm run build
```
- Output: `dist/`
- This is the standard MV3 build with a service worker background.

3) Produce the Firefox-friendly package (AMO-compatible)
```
node scripts/build-firefox.mjs
```
- Output directory: `dist-firefox/`
- Output zip: `smartfill-firefox.zip`

### What the Firefox build script does
- Reads `dist/manifest.json` and removes `background.type` if present.
- Converts `background.service_worker` into `background.scripts` (event page style) expected by AMO validation.
- Rewrites `service-worker-loader.js` to call:
  ```js
  self.importScripts('./assets/background.js-<hash>.js');
  ```
  which loads the built background bundle without using ES modules.

This preserves functionality while complying with AMO’s current MV3 validation constraints.

## Verification
After step 3 completes, verify:
- `dist-firefox/manifest.json` contains:
  ```json
  {
    "background": { "scripts": ["service-worker-loader.js"] }
  }
  ```
- `dist-firefox/service-worker-loader.js` uses `self.importScripts(...)`.
- The final distributable is `smartfill-firefox.zip`.

## Notes on Warnings
- AMO may warn about `innerHTML` usage in an auto-generated `styles-*.js` chunk produced by the bundler for CSS injection. This does not include user-supplied content and is a common pattern from build tools. Functionality is unaffected.

## Reproducibility
- The uploaded binary `smartfill-firefox.zip` is produced exactly by the steps above from the contents of this source archive.
- No manual edits to built files are required beyond what `scripts/build-firefox.mjs` performs programmatically.

## Optional: Regenerate Icons
If you need to re-generate icon assets from base sources, run:
```
node scripts/gen-icons.mjs
```
This uses `sharp` to produce multiple sizes into the `icons/` directory.

## Contact
If anything is unclear or you need additional instructions, please see inline comments in `scripts/build-firefox.mjs` and the manifest configuration in `manifest.config.js`.
