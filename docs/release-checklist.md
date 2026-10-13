# Release checklist

Run this in real browsers before uploading a release to the stores. Unit tests and the dev preview (`npm run dev:ui`) cover most logic, but not real permissions, real sites, or the browser's own UI.

## 1. Build

- [ ] `cd extension && npm ci && npm test` passes.
- [ ] `npm run package` creates the Chrome, Firefox and source zips in `release/`.
- [ ] Version in `manifest.config.js` and `package.json` matches the CHANGELOG heading.

## 2. Install fresh

Use a new browser profile, so no old data is involved.

- [ ] **Chrome:** load `extension/dist` unpacked. **Firefox:** load `dist-firefox/manifest.json` from `about:debugging`.
- [ ] The welcome page opens. Add details, skip pinning, fill the sample form, then Undo.
- [ ] No errors in the service worker console (`chrome://extensions` → Inspect views) or the page console.
- [ ] Install warnings list only "Read and change all your data on all websites" (no Anthropic access).

## 3. Filling (real sites)

- [ ] A Greenhouse application (`job-boards.greenhouse.io/<company>/jobs/<id>`): names, email, phone, resume upload, and the Country dropdown picks your country.
- [ ] A Lever application (`jobs.lever.co/<company>/<id>/apply`): location gets your city, and a saved answer fills "Are you legally authorized…". The language checkboxes are not touched.
- [ ] An Ashby or Workable application: essay questions stay empty.
- [ ] A checkout form: card fields are never filled.
- [ ] Preview: click a label to skip it, Fill, then Undo restores everything.
- [ ] Multi-step form (`/dev/steps.html` in the dev preview, or a real one): the next steps fill only empty fields.
- [ ] Right-click a field, then "Fill this field with…", then "Remember". Reload: the field fills automatically.
- [ ] Keyboard: Alt+Shift+F fills, Alt+Shift+Z undoes, Alt+Shift+P switches profile.

## 4. Features

- [ ] **Snippets:** add `;addr`, then type it in a text box, a textarea and Gmail compose. It expands. It doesn't expand in a password field.
- [ ] **History:** after a fill, Settings → History lists the site. The popup says "Filled here … ago". "Forget site" and "Clear history" work.
- [ ] **Test data:** turn it on in Settings → Developers. "Fill with test data" appears in the popup and the right-click menu, and gives a new person each time.
- [ ] **Hindi:** Settings → Language → हिन्दी. Popup, settings, toasts and the right-click menu are in Hindi. Back to English works.
- [ ] **PIN lock:**
  - [ ] Set a PIN. Close and reopen the browser: the popup asks for the PIN.
  - [ ] A wrong PIN shows an error. The right PIN unlocks.
  - [ ] Filling while locked shows "SmartFill is locked".
  - [ ] Change the PIN, Lock now, unlock with the new PIN.
  - [ ] "Forgot your PIN?" reset deletes profiles and keeps snippets. Restoring a backup afterwards works.
  - [ ] Turning the PIN lock off brings the data back unencrypted.
- [ ] **AI answers** (needs your own Anthropic API key):
  - [ ] Turn it on. The browser asks for permission for api.anthropic.com.
  - [ ] Save the key. It shows "Key saved and working".
  - [ ] Right-click an essay question, then "Draft an answer with AI". A draft appears, and Undo removes it.
  - [ ] Turning it off removes the permission (check `chrome://extensions` → Details → Site access).
- [ ] **Backup:** export, delete a profile, restore. Everything returns (including the resume).

## 5. Upgrade from the previous version

- [ ] Install the previous release zip and add a profile with a resume. Then load the new build over it (same extension ID, Reload): profiles, rules and resume are kept.

## 6. Store

- [ ] Paste the full description from `extension/store/LISTING.md`, and add the Hindi localized listing.
- [ ] Upload the screenshots from `extension/store/screenshots/` (regenerate with `npm run store:screenshots` while `npm run dev:ui` runs).
- [ ] Privacy tab: the permission justifications and data disclosures in `LISTING.md`, including the optional AI answers note.
- [ ] After approval: publish the GitHub release, merge the website PR, and set the store links on the website.
