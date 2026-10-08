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

  React.useEffect(() => {
    const load = async () => {
      const res = await chrome.runtime.sendMessage({ type: 'GET_RULES' })
      if (res?.ok) setRules(res.rules || [])
    }
    load()
    const onChanged = (changes, area) => {
      if (area === 'local' && changes.rules) setRules(changes.rules.newValue || [])
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

  return (
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
  )
}
