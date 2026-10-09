# Changelog

All notable changes to the SmartFill extension are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/Himanshuch8055/SmartFill/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Himanshuch8055/SmartFill/releases/tag/v1.0.0
