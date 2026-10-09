# Security Policy

SmartFill handles personal information (names, emails, addresses), so we take security seriously.

## Supported versions

Only the latest release published on the Chrome Web Store and Firefox Add-ons receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue.** Report privately through either:

- GitHub: [Report a vulnerability](https://github.com/Himanshuch8055/SmartFill/security/advisories/new) (private advisory), or
- Email: **himanshuch8055@gmail.com** with the subject "SmartFill security".

Please include the affected version, steps to reproduce, and the impact you expect. You'll get an acknowledgement within 3 business days and an update on the fix plan within 10 business days. We'll credit you in the release notes unless you'd prefer not to be named.

## What we consider in scope

- A web page being able to read profile data stored by SmartFill, or trigger a fill without user action.
- SmartFill filling or reading sensitive fields (passwords, card numbers, OTPs, government IDs).
- Data leaving the device in any way.
- Cross-site issues in the content script, popup, options or welcome pages.

Out of scope: issues requiring a compromised browser or operating system, or a malicious extension already installed.
