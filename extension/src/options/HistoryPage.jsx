import React from 'react'
import { Button, Input, Switch, ConfirmDialog } from '../ui'
import { send } from './data'
import { PageHeader, Group, SettingRow, EmptyRow, TextButton } from './layout'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function dayLabel(ts, now = new Date()) {
  const d = new Date(ts)
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(now) - start(d)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: days < 7 ? 'long' : undefined, day: 'numeric', month: 'long', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

export default function HistoryPage({ data }) {
  const { fillHistory, historyEnabled } = data
  const [query, setQuery] = React.useState('')
  const [confirmClear, setConfirmClear] = React.useState(false)

  const q = query.trim().toLowerCase()
  const visible = fillHistory.filter((e) => !q || e.host.toLowerCase().includes(q) || (e.profile || '').toLowerCase().includes(q))
  const byDay = []
  for (const e of visible) {
    const label = dayLabel(e.at)
    if (byDay.at(-1)?.label !== label) byDay.push({ label, entries: [] })
    byDay.at(-1).entries.push(e)
  }

  return (
    <div>
      <PageHeader
        title="History"
        description="Where you used SmartFill recently. Only the site, profile and number of fields are saved, never what was filled, and it stays on this device."
        actions={fillHistory.length > 0 && <Button size="sm" onClick={() => setConfirmClear(true)}>Clear history</Button>}
      />

      <Group>
        <SettingRow label="Keep a history of fills" htmlFor="set-history">
          <Switch id="set-history" checked={historyEnabled} onChange={(on) => chrome.storage.local.set({ historyEnabled: on })} />
        </SettingRow>
      </Group>

      {fillHistory.length > 8 && (
        <Input aria-label="Search history" placeholder="Search sites" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 w-56 mb-4" />
      )}

      {byDay.length === 0 ? (
        <Group>
          <EmptyRow>{fillHistory.length ? 'No matches.' : historyEnabled ? 'Nothing filled yet.' : 'History is off.'}</EmptyRow>
        </Group>
      ) : (
        byDay.map(({ label, entries }) => (
          <Group key={label} title={label}>
            {entries.map((e) => (
              <div key={e.at} className="flex items-center gap-4 px-4 py-2.5 text-[13px]">
                <span className="w-16 shrink-0 tabular-nums text-fg-subtle">
                  {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex-1 min-w-0 truncate font-medium">{e.host}</span>
                <span className="hidden sm:block w-32 truncate text-fg-muted">{e.profile}</span>
                <span className="w-36 text-right text-fg-muted">
                  {plural(e.filled, 'field')}{e.steps > 1 ? ` · ${e.steps} steps` : ''}
                </span>
                <TextButton onClick={() => send({ type: 'CLEAR_HISTORY', host: e.host })} title={`Remove every entry for ${e.host}`}>
                  Forget site
                </TextButton>
              </div>
            ))}
          </Group>
        ))
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => send({ type: 'CLEAR_HISTORY' })}
        title="Clear history?"
        description="This removes every entry. Your profiles and settings are not affected."
        confirmLabel="Clear history"
        danger
      />
    </div>
  )
}
