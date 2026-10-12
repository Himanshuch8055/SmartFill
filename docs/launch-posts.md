# SmartFill launch posts (drafts)

Ready-to-adapt posts for launch. Replace `<CHROME_LINK>` once the store listing is live. Post when you can reply to comments for the next few hours, since early replies matter most.

Links to use:
- Website and live demo: https://getsmartfill.vercel.app (demo: https://getsmartfill.vercel.app/#demo)
- GitHub: https://github.com/Himanshuch8055/SmartFill
- Chrome Web Store: `<CHROME_LINK>`

---

## Reddit: r/chrome_extensions

**Title:** I built a free, open-source form filler that shows you what it will fill before it fills

**Body:**

I got tired of retyping the same details into sign-up and job-application forms, and the browser's autofill kept missing fields or putting things in the wrong place. So I built SmartFill.

What's different from the built-in autofill:
- It highlights every field with the value it's about to put there. You can skip any field, then confirm.
- Every fill can be undone.
- It handles job-application fields (LinkedIn, GitHub, notice period, expected salary) and custom fields.
- If you correct a field, it can remember that for the site.
- It never touches password, card or OTP fields.

Everything stays in your browser. There's no account, no server and no analytics, and the code is on GitHub.

You can try it without installing on the website, which has a live demo: https://getsmartfill.vercel.app/#demo

Chrome: `<CHROME_LINK>` · Source: https://github.com/Himanshuch8055/SmartFill

I'd love feedback, especially sites where it fills something wrong.

---

## Reddit: r/jobsearchhacks (or r/jobs, if self-promotion is allowed; check the rules first)

**Title:** Free tool I made to stop retyping the same details into every job application

**Body:**

If you apply on Greenhouse, Lever and company career pages, you know the drill: name, email, phone, LinkedIn, GitHub, notice period, expected salary, again and again.

I built a free browser extension, SmartFill, that fills those in one click from a profile you save once. It shows you what it will put in each field first, so nothing goes in wrong, and you can undo. It keeps separate profiles too (for example, one per role you're targeting).

It's free and open source, and your details never leave your browser.

Demo (no install needed): https://getsmartfill.vercel.app/#demo

---

## Hacker News: Show HN

**Title:** Show HN: SmartFill – open-source form filler that previews before it fills

**Text:**

SmartFill is a browser extension (Chrome, Firefox) that fills forms from profiles you save locally.

A few design decisions that might interest HN:

- Detection scores each field from several signals: the autocomplete attribute, label text (including aria-labelledby and Google Forms headings), name/id and placeholder. Negative patterns keep look-alikes out, so "username" or "hotel name" don't get your full name, and it never fills password, cc-*, one-time-code or ID fields.
- Values are set through the native value setter and input/change events, so React-controlled inputs actually update their state.
- A preview overlay (shadow DOM) shows each field's value before anything changes. You can skip fields, and every fill can be undone from a snapshot.
- Corrections can be saved as per-site rules with a selector builder that avoids generated ids like `:r12:`.
- No backend at all: chrome.storage.local only, minimal permissions (storage, activeTab, contextMenus). MIT licensed.

Live demo in the browser: https://getsmartfill.vercel.app/#demo
Code: https://github.com/Himanshuch8055/SmartFill

Feedback on detection misses is especially welcome. Every reported site becomes a test fixture.

---

## Product Hunt

**Name:** SmartFill
**Tagline (60 chars):** Fill any form in one click. See what it fills first.
**Topics:** Chrome Extensions, Productivity, Open Source, Privacy

**Description:**
SmartFill fills sign-up, checkout and job-application forms from details you save once. Before anything changes, it highlights each field with the value it will get, so you can skip what you don't want, and every fill can be undone. It's free and open source, and everything stays in your browser.

**First comment (maker):**
Hi everyone! I built SmartFill because browser autofill kept missing fields on job applications and putting my full name into "first name". SmartFill reads labels and the page's own hints to pick the right field, shows you a preview, and never touches passwords or cards. There's no account and no server. Try the live demo on the website, and tell me where it fills something wrong; site reports are how detection gets better.

**Gallery:** use `extension/store/screenshots/1-fill-preview.png`, `2-popup.png`, `3-profiles.png`, `4-privacy.png`.

---

## LinkedIn

I just released SmartFill 1.0, a free, open-source browser extension I've been building.

If you've applied for jobs recently, you know how much time goes into typing the same details over and over: name, email, phone, LinkedIn, GitHub, notice period, expected salary.

SmartFill fills those in one click from a profile you save once. Before anything changes, it shows you exactly what it will put in each field. You can skip anything, and undo any fill.

A few things I cared about while building it:
🔒 Your details never leave your browser. No account, no server, no tracking.
✅ It never fills passwords, card numbers or one-time codes.
🧩 It works on Greenhouse, Lever, Google Forms and modern web apps.

Try the live demo, no install needed: https://getsmartfill.vercel.app/#demo
Source code: https://github.com/Himanshuch8055/SmartFill

Feedback is very welcome, especially sites where it misses a field.

#opensource #chromeextension #jobsearch #productivity

---

## X / Twitter (thread)

1/ I just shipped SmartFill 1.0, a free, open-source browser extension that fills forms in one click, and shows you what it'll fill before it does. 🧵

2/ Why? Browser autofill puts your full name in "first name", skips job-application fields, and gives you no way to check or undo.

3/ SmartFill highlights every field with its value first. Click to skip any field, then fill. Changed your mind? Undo.

4/ Job seekers: LinkedIn, GitHub, portfolio, notice period and expected salary on Greenhouse, Lever and company forms.

5/ Private by design: everything stays in your browser. No account, no server, no analytics. Passwords and cards are never touched.

6/ Try the live demo (no install): https://getsmartfill.vercel.app/#demo
Code (MIT): https://github.com/Himanshuch8055/SmartFill

---

## dev.to / Hashnode article outline

**Title:** How I made a form filler that doesn't put your full name in "First name"

1. The problem: why browser autofill misses fields (custom inputs, React state, ambiguous labels).
2. Scoring signals: autocomplete > label > name/id > placeholder > type, with weights.
3. Negative patterns and anchored matches ("hotel name", "authorized to work in this country?").
4. Filling React-controlled inputs: the native value setter and events.
5. Preview and undo: a shadow-DOM overlay and value snapshots.
6. Testing with real forms: HTML fixtures with `data-expect`, run in CI.
7. Privacy as a constraint: no backend, minimal permissions.
8. What's next, and how to contribute a site fixture.
