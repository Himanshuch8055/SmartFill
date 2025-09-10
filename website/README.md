# SmartFill Website (React + Vite + Tailwind)

Production-ready, responsive marketing site for the SmartFill extension.

## Stack
- React 18 + Vite
- Tailwind CSS (PostCSS + Autoprefixer)

## Scripts
```bash
# from website/
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
npm run preview   # preview the build at http://localhost:5174
```

## Edit install links
Update the store links in `src/utils/links.js`:

```js
export const CHROME_URL = 'https://chrome.google.com/webstore/detail/<your-id>'
export const FIREFOX_URL = 'https://addons.mozilla.org/firefox/addon/<your-slug>'
```

## Deploy
- Netlify: Drag-drop `dist/`, or connect repo (build: `npm ci && npm run build`, publish: `website/dist`).
- Vercel: Project root: `website/`, framework: Vite.
- GitHub Pages: `npm run build` then publish `website/dist` as Pages artifact.

## Structure
- `index.html` – Vite HTML shell
- `src/` – React app (components, utils)
- `tailwind.config.js`, `postcss.config.js` – Styling config
