# SmartFill website

The marketing site for the SmartFill extension: a landing page, the privacy policy, and a changelog generated from the repository's `CHANGELOG.md`. React, Vite and Tailwind, using the same design tokens as the extension (`src/tokens.css`).

## Develop

```bash
cd website
npm ci
npm run dev       # http://localhost:5173  (?theme=light or ?theme=dark to preview a theme)
npm run build     # outputs to dist/
```

## Product images

The images in `public/images/` are generated from the real extension screens, in light and dark versions:

```bash
cd extension
npm run dev:ui                    # in one terminal
npm run store:screenshots -- web-hero web-popup web-settings web-hero-dark web-popup-dark web-settings-dark og
```

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import `Himanshuch8055/SmartFill`.
2. Set **Root Directory** to `website`. Vercel detects Vite: build command `npm run build`, output `dist`.
3. Deploy. `vercel.json` sends every route (`/privacy`, `/changelog`) to the app and sets caching and security headers.

After the first deploy:

- Put the site URL in `extension/src/lib/links.js` (`SITE_URL`). The extension links to `SITE_URL/privacy`.
- Use `<site>/privacy` as the privacy policy URL in the Chrome Web Store and Firefox Add-ons dashboards.
- Make the `og:image` URL in `index.html` absolute (`<site>/images/og-image.png`) so link previews work everywhere.
- When the store listings are live, set `CHROME_URL` and `FIREFOX_URL` in `src/utils/links.js`. The install buttons switch from "Install from GitHub" to the store buttons automatically.
