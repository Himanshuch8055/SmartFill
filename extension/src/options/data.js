// Data access for the options page: one hook that loads profiles and settings and
// reloads whenever extension storage changes (from this page, the popup, or another tab).
import React from 'react'

export const send = (msg) => chrome.runtime.sendMessage(msg)

const SETTING_KEYS = ['popupProfileIds', 'widgetEnabled', 'fillMode', 'theme', 'rules', 'blockedSites', 'siteProfiles']

export function useExtensionData() {
  const [data, setData] = React.useState(null)

  const load = React.useCallback(async () => {
    const [prof, local] = await Promise.all([send({ type: 'GET_PROFILES' }), chrome.storage.local.get(SETTING_KEYS)])
    setData({
      profiles: prof?.profiles || [],
      activeId: prof?.activeProfileId || '',
      popupProfileIds: Array.isArray(local.popupProfileIds) ? local.popupProfileIds : [],
      widgetEnabled: local.widgetEnabled !== false,
      fillMode: local.fillMode === 'instant' ? 'instant' : 'preview',
      theme: local.theme || 'system',
      rules: local.rules || [],
      blockedSites: local.blockedSites || [],
      siteProfiles: local.siteProfiles || {},
    })
  }, [])

  React.useEffect(() => {
    load()
    let timer = 0
    const onChanged = (_changes, area) => {
      if (area !== 'local') return
      clearTimeout(timer)
      timer = setTimeout(load, 50)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [load])

  return [data, load]
}

// Minimal hash router: #/profile/<id>, #/sites, #/settings, #/backup, #/about
export function useRoute() {
  const parse = () => {
    const [, page = 'profile', id = ''] = (location.hash.replace(/^#/, '') || '/profile').split('/')
    return { page, id: decodeURIComponent(id) }
  }
  const [route, setRoute] = React.useState(parse)
  React.useEffect(() => {
    const onHash = () => setRoute(parse())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

export const go = (path) => {
  location.hash = path
}
