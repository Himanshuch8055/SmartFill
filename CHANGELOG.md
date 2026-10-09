# Changelog

All notable changes to the SmartFill extension are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Removed
- Field-count numbers on the toolbar icon and on the page button. The popup still shows how many fields were detected.

### Changed
- Redesigned popup: shows the current site and how many fields were detected, a single **Fill N fields** button, and simple switches for preview and turning SmartFill on or off for the site. Clear messages for protected pages and first-run setup; fill results and Undo appear in place.
- Redesigned settings page: profiles in a sidebar, edit any profile without making it active, changes save automatically, and separate Sites, Settings, Backup and About pages.
- Restoring a backup now shows what the file contains before replacing your data.
- New theme setting: System, Light or Dark.
- Redesigned on-page button: a small button docked to the edge of pages with form fields (only in the main page, not inside embedded frames). It stays tucked behind the edge and slides out as your cursor gets closer. One click fills the page; hover shows how many fields it will fill, with an option to hide it. Drag it up or down along the edge.
- Fill preview: labels sit inside the fields so the page's own labels stay visible. Click a label to skip that field.
- The "remember this field" question now appears next to the field. Messages appear at the bottom centre.
- New indigo look with light and dark themes.

## [1.0.0] - 2026-10-09

First public release.

### Added
- Weighted field detection using autocomplete hints, labels, names, placeholders and input types, with exclusions for look-alike fields.
- Fills every matching field, so billing and shipping sections both fill.
- Value handling: full-name split and join, phone length limits, date formats, dropdown aliases (e.g. "UK" ↔ United Kingdom), radio buttons and checkboxes.
- Profile fields: middle name, username, date of birth, gender, alternate phone, GitHub, portfolio, years of experience, current and expected salary, notice period, bio.
- Preview before filling, and undo for every fill.
- Keyboard shortcuts: `Alt+Shift+F` fill, `Alt+Shift+Z` undo, `Alt+Shift+P` next profile.
- Right-click menu: fill form, fill this field with…, undo, turn on/off for this site.
- Toolbar badge showing the number of fillable fields.
- Learning: offers to remember a field for a site after you correct it. New Site rules tab in options.
- Per-site controls: turn SmartFill off on a site, or always use a specific profile there.
- Full backup and restore (profiles, rules, site settings, preferences).
- Dark mode.
- Welcome page with quick setup and a demo form.

### Security
- Never fills or reads password, card, OTP, CAPTCHA or government-ID fields.

### Changed
- Reduced permissions to `storage`, `activeTab` and `contextMenus`.

[Unreleased]: https://github.com/Himanshuch8055/SmartFill/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Himanshuch8055/SmartFill/releases/tag/v1.0.0
