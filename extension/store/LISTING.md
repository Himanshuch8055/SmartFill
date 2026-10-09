# SmartFill — Store listing (Chrome Web Store & Firefox Add-ons)

## Name
SmartFill – Autofill Forms

## Short description (≤132 chars, Chrome "summary")
Fill forms in one click from your saved profiles. Preview, undo, per-site rules. Your data never leaves your browser.

## Category
Chrome: Productivity → Tools · Firefox: Privacy & Security / Other

## Full description

Tired of typing the same name, email, phone and address into every form? SmartFill fills them in one click, and it does it accurately.

**Fill smarter**
• Detects fields from labels, names, placeholders and the browser's autocomplete hints, so "First name" never gets your full name.
• Fills every matching field, including separate billing and shipping addresses.
• Handles dropdowns (e.g. "UK" ↔ United Kingdom), radio buttons, checkboxes, date pickers and phone length limits.
• Works with modern sites built on React, Vue and Angular, and with Google Forms.

**Stay in control**
• Preview: see exactly which fields will be filled, then confirm.
• Undo any fill with one click or Alt+Shift+Z.
• Right-click any field → "Fill this field with…".
• Turn SmartFill off on any site.

**Learns your sites**
Correct a field once and SmartFill offers to remember it for that website.

**Multiple profiles**
Keep Personal, Work and Job-hunting profiles. Switch with Alt+Shift+P, or set a default profile per site.

**Built for job applications**
Save LinkedIn, GitHub, portfolio, years of experience, notice period, current and expected salary, and a short bio.

**Private by design**
• Everything is stored only in your browser. No account, no servers, no tracking.
• Never touches password, card, OTP or ID-number fields.
• Export and restore a full backup anytime.

Keyboard shortcuts: Alt+Shift+F fill · Alt+Shift+Z undo · Alt+Shift+P switch profile.

## Permission justifications (Chrome "Privacy practices" tab)

| Permission | Justification |
|---|---|
| Content script on all sites | Detects form fields on the page the user is on, shows the optional on-page button and field count, and fills fields when the user asks. No page content is stored or transmitted. |
| storage | Saves the user's profiles, site rules and preferences locally on the device. |
| activeTab | Fills the current tab when the user clicks the toolbar button or uses a keyboard shortcut. |
| contextMenus | Adds "Fill this form" / "Fill this field with…" to the right-click menu. |

**Single purpose:** Fill web forms with information the user has saved in the extension.

**Data usage disclosures:** The extension handles "Personally identifiable information" and "Location (address)" that the user enters themselves. It is stored locally only and is not collected, sold, or transferred. Check: not used for unrelated purposes, not used for creditworthiness, not sold.

**Remote code:** No.

## Firefox (AMO) notes
- Add-on ID stays `himanshuch8055@gmail.com` (already published; changing it would break updates).
- Upload `release/smartfill-firefox-<version>.zip` and the source `release/smartfill-source-<version>.zip`.
- Build instructions for reviewers: Node 18+, `npm ci`, then `npm run build:firefox`. Output is in `dist-firefox/`.

## Before submitting
- [x] Website live at https://getsmartfill.vercel.app (`SITE_URL` in `src/lib/links.js`).
- [ ] Privacy policy URL for both store dashboards: **https://getsmartfill.vercel.app/privacy**
- [ ] Homepage / support URL for the listings: **https://getsmartfill.vercel.app**
- [x] Screenshots (1280×800) and promo tile (440×280) are in `store/screenshots/`. To regenerate them after UI changes, run `npm run dev:ui` and then `npm run store:screenshots`.
  1. `1-fill-preview.png`: Fill any form in one click (preview on a job application)
  2. `2-popup.png`: Your details, one click away (popup)
  3. `3-profiles.png`: Profiles for every part of life (settings)
  4. `4-privacy.png`: Private by design (About page)
  - `promo-tile-440x280.png`: Chrome small promo tile
- [ ] `npm test` passes and `npm run package` produces the zips in `release/`.
