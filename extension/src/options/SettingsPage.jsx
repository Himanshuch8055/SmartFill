import React from 'react'
import { Switch, SegmentedControl, Checkbox, setThemePreference } from '../ui'
import { PageHeader, Group, SettingRow, TextButton } from './layout'

const isFirefox = /firefox/i.test(navigator.userAgent)

function useShortcuts() {
  const [commands, setCommands] = React.useState([])
  React.useEffect(() => {
    chrome.commands?.getAll?.().then((list) => setCommands(list || [])).catch(() => {})
  }, [])
  return commands
}

export default function SettingsPage({ data }) {
  const shortcuts = useShortcuts()
  const set = (obj) => chrome.storage.local.set(obj)

  const togglePopupProfile = (id, on) => {
    const current = data.popupProfileIds.length ? data.popupProfileIds : data.profiles.map((p) => p.id)
    const next = on ? [...new Set([...current, id])] : current.filter((x) => x !== id)
    // An empty list means "show all", so keep at least one selected.
    if (next.length) set({ popupProfileIds: next.length === data.profiles.length ? [] : next })
  }
  const shownInPopup = (id) => !data.popupProfileIds.length || data.popupProfileIds.includes(id)

  const openShortcutSettings = () => {
    if (isFirefox) return
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <Group title="Filling">
        <SettingRow
          label="Preview before filling"
          description="Highlight the fields SmartFill will fill and confirm first. Every fill can be undone either way."
          htmlFor="set-preview"
        >
          <Switch id="set-preview" checked={data.fillMode === 'preview'} onChange={(on) => set({ fillMode: on ? 'preview' : 'instant' })} />
        </SettingRow>
        <SettingRow
          label="Show button on pages"
          description="A small SmartFill button in the corner of pages with forms."
          htmlFor="set-widget"
        >
          <Switch id="set-widget" checked={data.widgetEnabled} onChange={(on) => set({ widgetEnabled: on })} />
        </SettingRow>
      </Group>

      <Group title="Appearance">
        <SettingRow label="Theme">
          <SegmentedControl
            label="Theme"
            size="sm"
            value={data.theme}
            onChange={setThemePreference}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </SettingRow>
      </Group>

      {data.profiles.length > 1 && (
        <Group title="Profiles in the popup" description="Choose which profiles appear in the popup's profile menu.">
          {data.profiles.map((p) => (
            <div key={p.id} className="px-4 py-2.5">
              <Checkbox label={p.name || 'Profile'} checked={shownInPopup(p.id)} onChange={(on) => togglePopupProfile(p.id, on)} />
            </div>
          ))}
        </Group>
      )}

      <Group
        title="Keyboard shortcuts"
        aside={!isFirefox && <TextButton onClick={openShortcutSettings}>Change shortcuts</TextButton>}
      >
        {shortcuts.filter((c) => c.description).map((c) => (
          <div key={c.name} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
            <span>{c.description}</span>
            <span className="text-fg-muted">{c.shortcut || 'Not set'}</span>
          </div>
        ))}
        {isFirefox && (
          <p className="px-4 py-2.5 text-[12px] text-fg-muted">To change shortcuts, open about:addons → ⚙ → Manage Extension Shortcuts.</p>
        )}
      </Group>
    </div>
  )
}
