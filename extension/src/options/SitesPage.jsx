import React from 'react'
import { Input } from '../ui'
import { PROFILE_FIELDS } from '../lib/profileFields'
import { send } from './data'
import { PageHeader, Group, EmptyRow, TextButton } from './layout'

const LABELS = Object.fromEntries(PROFILE_FIELDS.map((f) => [f.name, f.label]))

function describeRule(rule) {
  if (rule.key) return LABELS[rule.key] || rule.key
  if (rule.value != null) return `Always “${rule.value}”`
  return '—'
}

export default function SitesPage({ data }) {
  const [query, setQuery] = React.useState('')
  const { rules, blockedSites, siteProfiles, profiles } = data

  const saveRules = (next) => send({ type: 'SAVE_RULES', rules: next })
  const q = query.trim().toLowerCase()
  const visibleRules = rules.filter(
    (r) => !q || (r.sitePattern || '').toLowerCase().includes(q) || describeRule(r).toLowerCase().includes(q)
  )
  const bySite = {}
  for (const r of visibleRules) (bySite[r.sitePattern || 'All sites'] ||= []).push(r)
  const profileName = (id) => profiles.find((p) => p.id === id)?.name || 'Deleted profile'
  const siteProfileEntries = Object.entries(siteProfiles)

  return (
    <div>
      <PageHeader title="Sites" description="How SmartFill behaves on specific websites." />

      <Group
        title="Remembered fields"
        description="Saved when you correct a field and choose Remember, or fill a field from the right-click menu."
        aside={rules.length > 6 && (
          <Input aria-label="Search remembered fields" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 w-48" />
        )}
      >
        {Object.keys(bySite).length === 0 ? (
          <EmptyRow>{rules.length ? 'No matches.' : 'Nothing remembered yet.'}</EmptyRow>
        ) : (
          Object.entries(bySite).sort(([a], [b]) => a.localeCompare(b)).map(([site, list]) => (
            <div key={site} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">{site}</p>
                <TextButton danger onClick={() => saveRules(rules.filter((r) => (r.sitePattern || 'All sites') !== site))}>
                  Forget site
                </TextButton>
              </div>
              <ul className="mt-1.5 space-y-1">
                {list.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px]">
                    <span className="w-40 shrink-0 text-fg">{describeRule(r)}</span>
                    <code className="flex-1 min-w-0 truncate text-[12px] text-fg-subtle" title={r.selector || r.labelRegex}>
                      {r.selector || (r.labelRegex ? `label matches /${r.labelRegex}/` : '')}
                    </code>
                    <TextButton onClick={() => saveRules(rules.filter((x) => x !== r))}>Remove</TextButton>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Group>

      <Group title="Turned off" description="SmartFill does nothing on these sites. Turn a site off from the popup.">
        {blockedSites.length === 0 ? (
          <EmptyRow>No sites turned off.</EmptyRow>
        ) : (
          blockedSites.map((host) => (
            <div key={host} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
              <span>{host}</span>
              <TextButton onClick={() => send({ type: 'SET_SITE_BLOCKED', host, blocked: false })}>Turn back on</TextButton>
            </div>
          ))
        )}
      </Group>

      {siteProfileEntries.length > 0 && (
        <Group title="Site profiles" description="These sites always use a specific profile, whichever profile is active.">
          {siteProfileEntries.map(([host, id]) => (
            <div key={host} className="flex items-center gap-4 px-4 py-2.5 text-[13px]">
              <span className="flex-1 truncate">{host}</span>
              <span className="text-fg-muted">{profileName(id)}</span>
              <TextButton onClick={() => send({ type: 'SET_SITE_PROFILE', host, profileId: '' })}>Remove</TextButton>
            </div>
          ))}
        </Group>
      )}
    </div>
  )
}
