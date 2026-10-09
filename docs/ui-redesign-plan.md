# SmartFill extension: UI/UX redesign plan

**Direction (decided):** clean and calm, with an **indigo** accent and a **sidebar app layout** for Options.
**Scope:** the extension only (popup, options, on-page widget, preview overlay and toasts, welcome page). The website comes after.

## Why redesign

How the current UI works:
- **Three separate styling systems:**
  - Tailwind utilities in the popup and options pages
  - hand-written CSS in the widget's shadow DOM
  - separate CSS in the preview overlay
  
  Colors and spacing drift between them.
- **No design tokens.** Colors are hard-coded (`gray-300`, `blue-600`…), and dark mode is an `!important` override layer.
- **Popup:** a list of controls. It doesn't answer the user's first question: *"Can SmartFill fill this page, and with what?"*
- **Options:** one 856-line component with top tabs, a manual Save button, and modals for every action.
- **No shared components:** every button and input repeats its class list, about 160 `className`s in Options alone.

**Goal:** one design system used everywhere. Every screen should make its main action obvious, show what will happen before it happens, and feel fast.

## Principles

1. **One obvious action per screen.** In the popup, that's *Fill form*.
2. **Show state, not settings.** The page's field count, the active profile, and whether this site is off are visible at a glance.
3. **Safe by default.** Preview, undo and clear feedback. Never a silent failure.
4. **Calm and trustworthy.** Neutral surfaces, one accent color, no clutter. Users store personal data here.
5. **Keyboard-first and accessible.** WCAG AA contrast, visible focus, everything reachable by keyboard, and `prefers-reduced-motion` respected.

---

## Phase D0: design foundation

Everything later builds on this.

- **Design tokens** in `src/ui/tokens.css` as CSS variables, with light and dark sets:
  - **Colors:** surface, surface-raised, border, text, text-muted, accent (indigo 600/500), accent-subtle, success, warning, danger
  - **Shape:** radius (6/10/14), shadows (sm/md/lg)
  - **Spacing:** a 4px grid
  - **Type scale:** 12/13/14/16/20/24, system font stack (no remote fonts: no remote code, small bundle)
- **Tailwind mapped to the tokens** (`bg-surface`, `text-muted`, `border-default`, `bg-accent`…). This removes the `!important` dark-mode layer.
- **Theme setting:** System / Light / Dark, applied with `data-theme` on `<html>`.
- **Icons:** `lucide-react`. Tree-shaken and consistent, replacing the inline SVGs.
- **Component library** in `src/ui/`:
  - Button (primary / secondary / ghost / danger, sizes, loading), IconButton
  - Input, Textarea, Select, Switch, Checkbox
  - Card, Badge, Kbd (shortcut chip)
  - Toast (stack, with action), Dialog (confirm), DropdownMenu, Tooltip
  - EmptyState, SegmentedControl, SectionHeader
- **Shadow-DOM styles from the same tokens.** A small `src/ui/shadowTheme.js` builds the token CSS string for the widget and overlay, so on-page UI matches the extension pages.
- **Motion:** 120–180ms ease-out for enter/exit and press. Turned off under `prefers-reduced-motion`.
- **Dev preview pages:** `npm run dev:ui` opens the popup, options and welcome pages in a normal browser tab with `chrome.*` mocked by an in-memory store and sample profiles.
  - Lets us check every screen and state in a browser, including desktop, mobile-width and dark mode, without loading the extension.
  - Also lets us take store screenshots.

## Phase D1: popup (360px wide)

```
┌────────────────────────────────┐
│ ◆ SmartFill      [Work ▾]   ⚙  │  header: logo, profile switcher, settings
├────────────────────────────────┤
│ 🌐 example.com                  │  page card
│    12 fields ready to fill      │
│                                 │
│ [        Fill form     ⏎      ] │  primary action, shows shortcut
│  Preview first           [●]    │
├────────────────────────────────┤
│ ↶ Undo   ⊘ Off on this site  📌 │  secondary actions
└────────────────────────────────┘
```

- **Page card:** site and favicon, plus the fillable-field count.
  - The background already receives `FIELD_COUNT` from the content script; it will keep a per-tab count and the popup asks for it.
  - If the site has a pinned profile, the card says so: "Uses Work on this site".
- **Profile switcher:** a dropdown with search when there are more than 5 profiles, a "Manage profiles…" link, and `Alt+Shift+P` shown in it.
- **Defined states**, each with its own message and action:
  - **No profile data yet:** "Add your details", which opens the welcome page.
  - **No fields found:** muted text; the Fill button stays enabled with a hint.
  - **Site turned off:** card shows "Off on this site" and a "Turn on" button.
  - **Restricted page** (`chrome://`, store pages): "SmartFill can't run on this page."
  - **Error:** inline message with a "Reload page" action.
- **Feedback:** results show as a toast inside the popup ("Filled 9 fields · Undo"), not plain text lines.
- **Widget toggle** moves to Settings. The popup keeps only per-page actions.
- **Rating prompt:** a small dismissible card at the bottom. Same rule as now: after 20 fills, shown once.

## Phase D2: Options as a sidebar app

```
┌──────────────┬──────────────────────────────────────────┐
│ ◆ SmartFill  │  Work                         Saved ✓     │
│              │  ────────────────────────────────────────  │
│ PROFILES     │  Personal  ▓▓▓▓▓▓░░ 6/7                    │
│ ● Work     ⋯ │  [First name] [Last name]                  │
│ ○ Personal   │  [Email]      [Phone]                      │
│ + New        │  Contact  ▓▓▓░░ 2/3 …                      │
│              │                                            │
│ Profile      │                                            │
│ Custom fields│                                            │
│ Site rules   │                                            │
│ Settings     │                                            │
│ Backup       │                                            │
│ About        │                                            │
└──────────────┴──────────────────────────────────────────┘
```

- **Split `options/main.jsx` into pages** under `src/options/pages/`: `ProfilePage`, `CustomFieldsPage`, `SiteRulesPage` (already separate), `SettingsPage`, `BackupPage`, `AboutPage`. Plus `Sidebar` and `ProfileList`.
- **Autosave** instead of the Save button. Edits save after 500ms of no typing, with a status of "Saving…", then "Saved ✓", or "Couldn't save" with Retry.
- **Profile management** from a `⋯` menu on each profile (rename inline, duplicate, delete with confirm dialog). The active profile is marked; you can click to edit a profile without making it active.
- **Profile page:**
  - Sections become cards, each with a completeness meter.
  - Fields use the right input type and placeholders. Date of birth uses a date picker, gender a segmented control.
  - Unfilled sections can be collapsed.
- **Settings:**
  - Fill behavior: preview vs instant
  - Widget on/off and position
  - Appearance: system, light or dark
  - Keyboard shortcuts: list plus "Change in browser" link
  - Popup profiles: which profiles appear in the switcher
- **Backup:** export and import with a short summary before importing ("3 profiles, 12 rules… Replace current data?").
- **About:** version, privacy summary and links (privacy policy, GitHub, rate, report a site).
- **Responsive:** below 900px the sidebar becomes a top bar with a menu.

## Phase D3: on-page UI (widget, preview, toasts)

- **Widget:** a small round floating button showing the logo and field count, collapsed by default. Click opens a compact panel (profile switcher, Fill, Undo, "Hide on this site"). Still draggable, snaps to the nearest edge, and remembers its position.
- **Preview overlay:**
  - Highlight colors and badges come from the tokens.
  - Badge shows the field label and value; long values are truncated with a tooltip.
  - **New:** click a badge to skip that field. The bar updates "Fill 11 of 12".
  - The bar becomes a compact pill at the top center, with Fill (⏎) and Cancel (Esc).
- **Toasts:** one consistent component (icon, text, optional action, progress bar for auto-dismiss). Stacks bottom-right and never covers the page's own submit buttons.
- **Learn prompt** ("Always fill this field with Email?"): an anchored popover next to the field instead of a global toast.

## Phase D4: welcome / onboarding

- Three-step layout with a progress indicator: **1** Your details → **2** Pin SmartFill → **3** Try it.
- Step 2 shows an illustrated pin guide for Chrome and Firefox (inline SVG, no images to load).
- Step 3's demo form shows the real preview UI before filling, so the user meets preview, fill and undo the way it works on real pages.
- Ends with "You're all set" and the keyboard shortcuts.

## Phase D5: brand and polish

- **Icon:** a new indigo version, exported to all sizes with `scripts/gen-icons.mjs`.
- **Accessibility check:** add `vitest-axe` checks for the popup and options pages, and a manual pass for keyboard navigation and screen-reader labels.
- **Store screenshots:** 1280×800, taken from the D0 preview pages in both light and dark mode.

---

## Implementation notes

- **Branches:** each phase goes on a `feature/ui-<phase>` branch from `main`, with one PR per phase. Order: D0 → D1 → D2 → D3 → D4 → D5. D3 and D4 can run alongside D2 once D0 is merged.
- **No behavior regressions.** The message API (`AUTOFILL_ACTIVE`, `GET_PROFILES`…), the storage format and the detection engine are unchanged, and all 35 tests keep passing. The only new background message is a per-tab field count for the popup.
- **Bundle size:** keep the popup under about 60 KB gzipped. Only lucide icons and tokens are added; no UI framework (no MUI or Chakra).
- **Verification for each phase:**
  - `npm test`
  - check the screens on the D0 preview pages in light and dark, at popup width and mobile width
  - load the built extension in Chrome and Firefox for a manual check

## Decisions still open

These can be settled as we reach each phase:
- Autosave versus an explicit Save button in Options. The plan assumes autosave.
- Whether the floating widget stays **on by default** or becomes opt-in now that the toolbar badge shows the field count.
