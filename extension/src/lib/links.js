// External links used by the extension UI.
// The website (deployed on Vercel from website/). The privacy policy lives at /privacy.
export const SITE_URL = 'https://getsmartfill.vercel.app'
export const PRIVACY_URL = `${SITE_URL}/privacy`

const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent)

// Review page for the current store listing. The extension id is the listing id on both stores
// (Chrome Web Store id / AMO add-on GUID), so this works once published.
export function reviewUrl() {
  const id = globalThis.chrome?.runtime?.id || ''
  return isFirefox
    ? `https://addons.mozilla.org/firefox/addon/${encodeURIComponent(id)}/reviews/`
    : `https://chromewebstore.google.com/detail/${id}/reviews`
}
