import React from 'react'
import { PROFILE_FIELDS } from '../lib/profileFields'

const LABELS = Object.fromEntries(PROFILE_FIELDS.map((f) => [f.name, f.label]))

function describe(rule) {
  if (rule.key) return LABELS[rule.key] || rule.key
  if (rule.value != null) return `Fixed value: "${rule.value}"`
  return '—'
}

// Lists per-site rules (saved via "Remember" prompts or the right-click menu) and lets users delete them.
export default function SiteRules() {
  const [rules, setRules] = React.useState([])
  const [query, setQuery] = React.useState('')
  const [blockedSites, setBlockedSites] = React.useState([])
  const [siteProfiles, setSiteProfiles] = React.useState({})
  const [profiles, setProfiles] = React.useState([])

  React.useEffect(() => {
    const load = async () => {
      const res = await chrome.runtime.sendMessage({ type: 'GET_RULES' })
      if (res?.ok) setRules(res.rules || [])
      const data = await chrome.storage.local.get(['blockedSites', 'siteProfiles', 'profiles'])
      setBlockedSites(data.blockedSites || [])
      setSiteProfiles(data.siteProfiles || {})
      setProfiles(data.profiles || [])
    }
    load()
    const onChanged = (changes, area) => {
      if (area !== 'local') return
      if (changes.rules) setRules(changes.rules.newValue || [])
      if (changes.blockedSites) setBlockedSites(changes.blockedSites.newValue || [])
      if (changes.siteProfiles) setSiteProfiles(changes.siteProfiles.newValue || {})
      if (changes.profiles) setProfiles(changes.profiles.newValue || [])
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const persist = async (next) => {
    setRules(next)
    await chrome.runtime.sendMessage({ type: 'SAVE_RULES', rules: next })
  }

  const removeRule = (rule) => persist(rules.filter((r) => r !== rule))
  const removeSite = (site) => persist(rules.filter((r) => (r.sitePattern || '*') !== site))

  const q = query.trim().toLowerCase()
  const groups = {}
  for (const r of rules) {
    const site = r.sitePattern || '*'
    if (q && !site.toLowerCase().includes(q) && !describe(r).toLowerCase().includes(q)) continue
    ;(groups[site] ||= []).push(r)
  }
  const sites = Object.keys(groups).sort()

  const unblock = (host) => chrome.runtime.sendMessage({ type: 'SET_SITE_BLOCKED', host, blocked: false })
  const unpin = (host) => chrome.runtime.sendMessage({ type: 'SET_SITE_PROFILE', host, profileId: '' })
  const profileName = (id) => profiles.find((p) => p.id === id)?.name || 'Deleted profile'
  const pinned = Object.entries(siteProfiles)

  return (
    <div className="space-y-6">
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold">Site rules</h2>
          <p className="text-sm text-gray-600">
            Fields SmartFill has learned on specific websites. Add one by choosing "Remember" after correcting a field,
            or by right-clicking a field → Fill this field with.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sites or fields"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full sm:w-64"
        />
      </div>

      {sites.length === 0 ? (
        <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl p-8 text-center">
          {rules.length ? 'No rules match your search.' : 'No site rules yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map((site) => (
            <div key={site} className="border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200">
                <span className="font-medium text-sm">{site === '*' ? 'All sites' : site}</span>
                <button onClick={() => removeSite(site)} className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50">
                  Delete all
                </button>
              </div>
              <ul className="divide-y divide-gray-100">
                {groups[site].map((r, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="font-medium min-w-[140px]">{describe(r)}</span>
                    <code className="flex-1 truncate text-xs text-gray-500" title={r.selector || r.labelRegex}>
                      {r.selector || (r.labelRegex ? `label ~ /${r.labelRegex}/` : '')}
                    </code>
                    <button onClick={() => removeRule(r)} aria-label="Delete rule" className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50">
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold">Turned off on</h2>
        <p className="text-sm text-gray-600 mb-3">SmartFill does nothing on these sites. Turn it off from the popup or the right-click menu.</p>
        {blockedSites.length === 0 ? (
          <div className="text-sm text-gray-500">No sites.</div>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
            {blockedSites.map((h) => (
              <li key={h} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{h}</span>
                <button onClick={() => unblock(h)} className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50">Turn back on</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold">Site profiles</h2>
        <p className="text-sm text-gray-600 mb-3">These sites always use a specific profile, whichever profile is active.</p>
        {pinned.length === 0 ? (
          <div className="text-sm text-gray-500">No sites.</div>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
            {pinned.map(([h, id]) => (
              <li key={h} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="truncate">{h}</span>
                <span className="text-gray-600 truncate">{profileName(id)}</span>
                <button onClick={() => unpin(h)} className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </div>
  )
}
