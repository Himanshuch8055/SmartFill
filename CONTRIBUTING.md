# Contributing to SmartFill

Thanks for helping make form filling less painful! This guide covers how to report problems, set up the project and send changes.

## Ways to help

- **Report a site where SmartFill fills incorrectly.** This is the most valuable contribution. Use the *Site not filling correctly* issue template and include the page URL (if public) and which fields went wrong.
- **Report bugs** or **suggest features** using the issue templates.
- **Fix detection** for a site by adding a test fixture (see below).
- **Improve docs, translations and the website.**

Please search existing issues before opening a new one. For larger changes, open an issue first so we can agree on the approach.

## Development setup

Requirements: Node.js 20+, npm, Chrome or Firefox.

```bash
git clone https://github.com/Himanshuch8055/SmartFill.git
cd SmartFill/extension
npm ci
npm run dev      # or: npm run build
npm test
```

Load `extension/dist` as an unpacked extension (`chrome://extensions` → Developer mode → Load unpacked). After rebuilding, click the reload icon on the extension card.

### Working on the UI

```bash
npm run dev:ui   # http://localhost:5180/dev/index.html
```

This opens the popup, options and welcome pages side by side in a normal browser tab, with `chrome.*` mocked by sample data (`src/dev/chromeMock.js`). It has theme (system, light, dark) and scenario controls (active tab URL, number of fields). `/dev/gallery.html` shows every UI kit component, and `/dev/form.html` is a sample job application with the real content script running (on-page button, preview, prompts). `npm run store:screenshots` (with `dev:ui` running) regenerates the store screenshots from `/dev/store.html`. Build UI from `src/ui/` (tokens and components) instead of raw colors: use `bg-surface`, `text-fg-muted`, `border-line` and `bg-accent`, never `gray-*` or `blue-*`.

Project structure (extension):

| Path | Purpose |
|---|---|
| `src/lib/detectFields.js` | Field detection (scoring) and filling, plus undo snapshots |
| `src/lib/storage.js` | Profiles, rules, per-site settings, backup/restore |
| `src/lib/selector.js` | Stable CSS selectors for learned site rules |
| `src/content/` | Content script: widget, preview overlay, learning |
| `src/background.js` | Message router, shortcuts, context menu, badge |
| `src/popup/`, `src/options/`, `src/welcome/` | UI pages (React + Tailwind) |
| `test/` | Vitest tests; `test/fixtures/*.html` are real-world form samples |

## Fixing detection for a site (fixtures)

1. Save a trimmed copy of the form's HTML as `extension/test/fixtures/<site>.html`. Remove personal data, scripts and unrelated markup.
2. Add `data-expect="<key>"` to every field (`email`, `firstName`, `phone`, …), or `data-expect="none"` for fields that must not be filled. Valid keys are listed in `FIELD_SPECS` in `src/lib/detectFields.js`.
3. Run `npm test`. Failures list each mismatched field.
4. Adjust the patterns in `FIELD_SPECS`. Prefer narrow, specific patterns, and make sure all other fixtures still pass.

## Branches, commits and pull requests

- Branch from `main` using `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>` or `chore/<short-name>`.
- Write commits in the [Conventional Commits](https://www.conventionalcommits.org/) style: `feat(extension): …`, `fix: …`, `docs: …`, `test: …`, `ci: …`, `chore: …`.
- Keep pull requests focused. Fill in the PR template, add or update tests, and update `CHANGELOG.md` under *Unreleased* for user-visible changes.
- `main` is protected: CI (tests, packaging, website build) must pass before merging.

## Code style

- Match the surrounding code: plain JavaScript/JSX, no semicolons, 2-space indentation, single quotes (see `.editorconfig`).
- Content scripts run on every page: keep them fast, never throw into the page, and never send page data off the device.
- Never fill or read sensitive fields (passwords, cards, OTPs, government IDs). `isSensitive()` enforces this; don't weaken it.
- Don't add new permissions without discussing it in an issue first. Every permission must be justified in `extension/store/LISTING.md`.

## Releasing (maintainers)

1. Update `version` in `extension/manifest.config.js` and move *Unreleased* entries in `CHANGELOG.md` to the new version.
2. Merge to `main`, then tag: `git tag v1.2.3 && git push origin v1.2.3`.
3. The Release workflow builds the zips and creates a draft GitHub Release. Upload the zips to the Chrome Web Store and Firefox Add-ons, then publish the release.

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.
