// External links used by the extension UI.
// The website (deployed on Vercel from website/). The privacy policy lives at /privacy.
export const SITE_URL = 'https://getsmartfill.vercel.app'
export const PRIVACY_URL = `${SITE_URL}/privacy`
export const GOODBYE_URL = `${SITE_URL}/goodbye`
export const REPO_URL = 'https://github.com/Himanshuch8055/SmartFill'

// Pre-filled "site not filling" issue. Only the domain is included, never the full URL
// (paths and query strings can contain personal data).
export function reportSiteUrl(host, version) {
  const params = new URLSearchParams({ template: 'site_not_filling.yml' })
  if (host) params.set('url', host)
  if (version) params.set('version', version)
  return `${REPO_URL}/issues/new?${params}`
}

const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent)

// Review page for the current store listing. The extension id is the listing id on both stores
// (Chrome Web Store id / AMO add-on GUID), so this works once published.
export function reviewUrl() {
  const id = globalThis.chrome?.runtime?.id || ''
  return isFirefox
    ? `https://addons.mozilla.org/firefox/addon/${encodeURIComponent(id)}/reviews/`
    : `https://chromewebstore.google.com/detail/${id}/reviews`
}
