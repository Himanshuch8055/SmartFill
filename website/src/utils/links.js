// External links. Set the store URLs once SmartFill is published; until then the
// install buttons point to the GitHub install instructions.
export const CHROME_URL = null // e.g. 'https://chromewebstore.google.com/detail/<id>'
export const FIREFOX_URL = null // e.g. 'https://addons.mozilla.org/firefox/addon/<slug>/'

export const GITHUB_URL = 'https://github.com/Himanshuch8055/SmartFill'
export const INSTALL_FROM_SOURCE_URL = `${GITHUB_URL}#install`
export const ISSUES_URL = `${GITHUB_URL}/issues/new/choose`
export const REPORT_SITE_URL = `${GITHUB_URL}/issues/new?template=site_not_filling.yml`
export const CONTACT_EMAIL = 'himanshuch8055@gmail.com'

// Support links. Fill in the usernames you create; anything left null is hidden on the site.
export const SUPPORT = {
  githubSponsors: 'Himanshuch8055', // GitHub username, e.g. 'Himanshuch8055' -> github.com/sponsors/Himanshuch8055
  buyMeACoffee: null, // e.g. 'himanshu' -> buymeacoffee.com/himanshu
  kofi: null, // e.g. 'himanshu' -> ko-fi.com/himanshu
}

export const SUPPORT_LINKS = [
  SUPPORT.githubSponsors && { id: 'github', label: 'Sponsor on GitHub', note: 'Monthly or one-time. GitHub takes no fees.', href: `https://github.com/sponsors/${SUPPORT.githubSponsors}` },
  SUPPORT.buyMeACoffee && { id: 'bmc', label: 'Buy me a coffee', note: 'A quick one-time thank-you.', href: `https://buymeacoffee.com/${SUPPORT.buyMeACoffee}` },
  SUPPORT.kofi && { id: 'kofi', label: 'Support on Ko-fi', note: 'A quick one-time thank-you.', href: `https://ko-fi.com/${SUPPORT.kofi}` },
].filter(Boolean)
