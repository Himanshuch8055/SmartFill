# Changelog

All notable changes to the SmartFill extension are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- AI answers (optional, off by default): right-click a free-text question and choose "Draft an answer with AI" to get a draft written from your profile and the page, using your own Anthropic API key. The draft goes into the field for you to edit (with Undo); nothing is submitted. Only the question, page text and non-contact profile details are sent, and only when you ask. Access to the AI service is an optional permission requested when you turn the feature on. Settings → AI answers.
- PIN lock (optional): encrypts your profiles and resume files on the device (AES-256-GCM, key derived from your PIN). Enter the PIN once per browser session, or set SmartFill to lock after 15 minutes, 1 hour or 4 hours without use. Lock now from the popup. A forgotten PIN can't be recovered; SmartFill can be reset (profiles deleted, settings kept) and restored from a backup. Settings → PIN lock.
- Custom dropdowns: SmartFill now picks options in search-as-you-type dropdowns (React Select and similar), used by Greenhouse, Ashby and many others for country, location and screening questions.
- Hindi translation (हिन्दी). SmartFill follows your browser language, or pick one in Settings → Appearance → Language. The store listing name and description are translated too.
- Test data for developers: turn on "Fill with test data" in Settings → Developers to fill forms with a new made-up person each time (example.com emails, fake phone numbers, matching city/state/country). Available from the popup and the right-click menu, and kept for the next steps of a multi-page form.
- Fill history: a new History page lists where you used SmartFill (site, profile, number of fields; steps of one form are grouped). The popup shows "Filled here 3 days ago" on sites you already filled. Stays on your device, never stores what was filled, and can be turned off or cleared.
- Text snippets: save text under a shortcut like `;addr`, then type the shortcut in any text field or editor to insert it. `{date}` and `{time}` are filled in when inserted. Never runs in password or payment fields, or on sites you turned off. Manage them on the new Snippets page in Settings.

### Fixed
- A list of checkboxes could be mistaken for a profile field (for example "Telugu (TEL)" filled as a phone number). Checkboxes are no longer used for profile fields.
- Questions shown above a field instead of in a label (Lever custom questions, many React forms) are now read, so saved answers match them.
- "Current location" and "Where are you currently located?" fields are filled with your city.
- "How did you hear about this opportunity?" now matches a saved "How did you hear about this job?" answer.
- Long essay questions ("Share your open-source work… and your role", "Why this company…") are no longer mistaken for profile fields like job title or company.
- Forms embedded in frames without their own address (HubSpot, Marketo and similar embeds) are now detected.

## [1.1.0] - 2026-10-12

### Added
- Multi-page forms: after you fill one step of a long form, SmartFill fills the next steps too, whether they appear on the same page or a new page on the same site. It only fills empty fields, never changes what you typed, and stops if you cancel the preview. Can be turned off in Settings.
- Job applications: save your resume (PDF or Word, up to 2 MB) once and SmartFill attaches it to resume/CV upload fields.
- Screening questions: save answers to questions like "Are you authorized to work…?" or "Do you need visa sponsorship?". SmartFill matches them by wording and fills dropdowns, yes/no options and text boxes. One click adds common questions to start from.
- Education fields: school, degree, field of study and graduation year.
- "Report this site" link in the popup when no form fields are found. It opens a pre-filled report with only the site's domain.
- After uninstalling, a short page with fixes for common problems and ways to report them. Nothing is collected.

## [1.0.0] - 2026-10-09

First public release.

### Filling
- Accurate field detection using the browser's autocomplete hints, labels, field names and placeholders, with exclusions for look-alike fields, so "First name" never gets your full name and "Hotel name" is left alone.
- Fills every matching field, so billing and shipping sections both fill.
- Handles dropdowns (e.g. "UK" matches United Kingdom), radio buttons, checkboxes, date pickers and phone length limits, and splits or joins your full name as a form needs.
- Works with Google Forms and with forms built in React, Vue and Angular.
- Preview before filling: every field is highlighted with the value it will get. Click a label to skip a field.
- Undo any fill.

### Using SmartFill
- Popup with the current site, how many fields were detected, a single **Fill N fields** button, and switches for preview and for turning SmartFill on or off on the site.
- A small button docked to the edge of pages with form fields. It slides out as your cursor gets closer, and one click fills the page.
- Keyboard shortcuts: `Alt+Shift+F` fill, `Alt+Shift+Z` undo, `Alt+Shift+P` next profile.
- Right-click menu: fill the form, fill a single field with any profile value, undo, turn SmartFill on or off for the site.
- Learns your sites: correct a field and SmartFill offers to remember it for that website.

### Profiles and settings
- Multiple profiles, with fields for personal details, contact, work, job applications (LinkedIn, GitHub, portfolio, experience, notice period, salary) and address, plus custom fields for anything else.
- Settings page with a profile sidebar. Edit any profile; changes save automatically.
- Sites page to review remembered fields, sites where SmartFill is off, and sites that use a specific profile.
- Full backup and restore. Restoring shows what the file contains first.
- Light, dark or system theme.
- Welcome page with three quick steps and a demo form.

### Privacy and security
- Everything is stored only in your browser. No account, no server, no analytics.
- Never fills or reads password, payment card, one-time code, CAPTCHA or government ID fields.
- Minimal permissions: `storage`, `activeTab` and `contextMenus`.

[Unreleased]: https://github.com/Himanshuch8055/SmartFill/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Himanshuch8055/SmartFill/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Himanshuch8055/SmartFill/releases/tag/v1.0.0
