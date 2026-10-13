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
• Handles dropdowns (e.g. "UK" ↔ United Kingdom), including search-as-you-type dropdowns, plus radio buttons, checkboxes, date pickers and phone length limits.
• Long forms split into steps? Fill the first step and SmartFill fills the next ones too, without changing anything you typed.
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
Attach your resume automatically, answer common screening questions (work authorization, visa sponsorship, relocation), and fill LinkedIn, GitHub, education, experience, notice period and salary fields. Tested on Greenhouse, Lever, Ashby and Workable.

**Text snippets**
Type a shortcut like ;addr in any text box and SmartFill replaces it with your saved text.

**Fill history**
See where you used SmartFill, and get a "Filled here 3 days ago" reminder on sites you've already filled. Stays on your device and can be turned off.

**In your language**
English and Hindi (हिन्दी).

**Private by design**
• Everything is stored only in your browser. No account, no servers, no tracking.
• Never touches password, card, OTP or ID-number fields.
• Export and restore a full backup anytime.
• Optional PIN lock encrypts your profiles on this device.

**For developers**
Optional "Fill with test data" fills forms with a new made-up person each time, for testing your own forms.

Keyboard shortcuts: Alt+Shift+F fill · Alt+Shift+Z undo · Alt+Shift+P switch profile.

## Hindi listing (Chrome: add a localized listing for "Hindi")

**Short description:** सहेजी गई प्रोफ़ाइल से एक क्लिक में फ़ॉर्म भरें। प्रीव्यू, अनडू और हर साइट के लिए नियम। आपका डेटा कभी आपके ब्राउज़र से बाहर नहीं जाता।

**Full description:**

हर फ़ॉर्म में वही नाम, ईमेल, फ़ोन और पता बार-बार लिखते-लिखते थक गए? SmartFill इन्हें एक क्लिक में, सही-सही भर देता है।

• भरने से पहले दिखाता है कि कौन-सा फ़ील्ड किस जानकारी से भरेगा। जो न चाहें, उसे छोड़ दें।
• एक क्लिक में पहले जैसा करें (Alt+Shift+Z)।
• काम, निजी और नौकरी की तलाश के लिए अलग-अलग प्रोफ़ाइल।
• नौकरी के आवेदन: रिज़्यूमे अपने-आप लगाता है और आम स्क्रीनिंग सवालों के जवाब भरता है।
• कई चरणों वाले फ़ॉर्म में अगले चरण भी भरता है, आपका लिखा कभी नहीं बदलता।
• स्निपेट: ;addr जैसा शॉर्टकट लिखें और आपका सेव किया टेक्स्ट आ जाएगा।
• पासवर्ड, कार्ड नंबर, OTP और पहचान नंबर कभी नहीं भरता।
• चाहें तो PIN लॉक से अपनी प्रोफ़ाइल एन्क्रिप्ट करें।
• सब कुछ सिर्फ़ आपके ब्राउज़र में रहता है। न अकाउंट, न सर्वर, न ट्रैकिंग।

कीबोर्ड शॉर्टकट: Alt+Shift+F भरें · Alt+Shift+Z पहले जैसा करें · Alt+Shift+P प्रोफ़ाइल बदलें।

## Permission justifications (Chrome "Privacy practices" tab)

| Permission | Justification |
|---|---|
| Content script on all sites | Detects form fields on the page the user is on, shows the optional on-page button and field count, and fills fields when the user asks. No page content is stored or transmitted. |
| storage | Saves the user's profiles, site rules and preferences locally on the device. |
| activeTab | Fills the current tab when the user clicks the toolbar button or uses a keyboard shortcut. |
| contextMenus | Adds "Fill this form" / "Fill this field with…" to the right-click menu. |
| api.anthropic.com (optional host permission) | Requested only when the user turns on AI answers; used to send the user's own draft requests with their own API key. |

**Single purpose:** Fill web forms with information the user has saved in the extension.

**Data usage disclosures:** The extension handles "Personally identifiable information" and "Location (address)" that the user enters themselves. It is stored locally only and is not collected, sold, or transferred. Check: not used for unrelated purposes, not used for creditworthiness, not sold.

**Optional AI answers:** off by default. When the user turns it on, the extension requests the optional host permission `https://api.anthropic.com/*`. Only when the user chooses "Draft an answer with AI" on a field, the question, page text excerpt and non-contact profile details are sent to Anthropic with the user's own API key. Disclose under "Personally identifiable information" and "Website content": transferred to a third party only at the user's request, for the feature the user asked for. The developer never receives this data.

**Remote code:** No.

## Firefox (AMO) notes
- Add-on ID stays `himanshuch8055@gmail.com` (already published; changing it would break updates).
- Upload `release/smartfill-firefox-<version>.zip` and the source `release/smartfill-source-<version>.zip`.
- Build instructions for reviewers: Node 18+, `npm ci`, then `npm run build:firefox`. Output is in `dist-firefox/`.

## Microsoft Edge Add-ons
- Free to publish. Register at Partner Center → Microsoft Edge program (https://partner.microsoft.com/dashboard/microsoftedge).
- Upload the **Chrome** zip (`release/smartfill-chrome-<version>.zip`); Edge runs Chrome extensions unchanged.
- Reuse the Chrome listing text, screenshots, permission justifications and privacy policy URL from this file.
- Category: Productivity. Review usually takes a few business days.

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
