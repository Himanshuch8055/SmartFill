import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import { Plus } from 'lucide-react'
import { initTheme, IconButton, ToastProvider, useToast, UnlockForm, ConfirmDialog, cn } from '../ui'
import { useExtensionData, useRoute, send, go } from './data'
import ProfilePage from './ProfilePage'
import SitesPage from './SitesPage'
import SnippetsPage from './SnippetsPage'
import HistoryPage from './HistoryPage'
import SettingsPage from './SettingsPage'
import BackupPage from './BackupPage'
import AboutPage from './AboutPage'
import { t, mark, initLanguage } from '../lib/i18n'

initTheme()

const PAGES = [
  { id: 'snippets', label: mark('Snippets') },
  { id: 'history', label: mark('History') },
  { id: 'sites', label: mark('Sites') },
  { id: 'settings', label: mark('Settings') },
  { id: 'backup', label: mark('Backup') },
  { id: 'about', label: mark('About') },
]

function NavItem({ active, onClick, children, trailing }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'md:w-full h-8 px-2.5 flex items-center gap-2 rounded-md text-[13px] text-left whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-focus/60',
        active ? 'bg-surface-2 text-fg font-medium' : 'text-fg-muted hover:text-fg hover:bg-surface-2/60'
      )}
    >
      <span className="truncate flex-1">{children}</span>
      {trailing}
    </button>
  )
}

function Sidebar({ data, route }) {
  const createProfile = async () => {
    const res = await send({ type: 'CREATE_PROFILE', name: t('New profile'), data: {} })
    if (res?.id) go(`/profile/${res.id}`)
  }
  const openId = route.page === 'profile' ? route.id || data.activeId : ''

  return (
    <nav aria-label={t('Settings')} className="md:w-56 md:shrink-0 md:h-screen md:sticky md:top-0 md:border-r border-b md:border-b-0 border-line bg-surface md:flex md:flex-col">
      <div className="h-12 md:h-14 px-5 flex items-center">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">SmartFill</span>
      </div>

      {/* Wide screens: vertical sidebar. Narrow screens: one horizontally scrolling row. */}
      <div className="px-3 pb-2 md:pb-3 md:flex-1 md:overflow-y-auto flex md:block gap-1 overflow-x-auto">
        <div className="hidden md:flex items-center justify-between px-2.5 mt-1 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{t('Profiles')}</span>
          <IconButton icon={Plus} label={t('New profile')} size="sm" className="h-6 w-6 -mr-1" onClick={createProfile} />
        </div>
        <div className="flex md:block gap-1 md:space-y-0.5 shrink-0">
          {data.profiles.map((p) => (
            <NavItem
              key={p.id}
              active={openId === p.id}
              onClick={() => go(`/profile/${p.id}`)}
              trailing={p.id === data.activeId && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" title={t('Active profile')} aria-label={t('Active')} />}
            >
              {p.name || t('Profile')}
            </NavItem>
          ))}
          <IconButton icon={Plus} label={t('New profile')} size="sm" className="md:hidden shrink-0" onClick={createProfile} />
        </div>
        <span aria-hidden className="md:hidden w-px my-1.5 bg-line shrink-0" />
        <div className="flex md:block gap-1 md:mt-6 md:space-y-0.5 shrink-0">
          {PAGES.map((pg) => (
            <NavItem key={pg.id} active={route.page === pg.id} onClick={() => go(`/${pg.id}`)}>
              {t(pg.label)}
            </NavItem>
          ))}
        </div>
      </div>
    </nav>
  )
}

// While locked, settings can't show profiles. A forgotten PIN can only be reset, which deletes them.
function LockedScreen() {
  const [confirmReset, setConfirmReset] = React.useState(false)
  return (
    <div className="min-h-screen bg-bg text-fg grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-sf-sm">
        <UnlockForm onUnlocked={() => location.reload()} onForgot={() => setConfirmReset(true)} />
      </div>
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={async () => {
          await send({ type: 'RESET_FORGOTTEN_PIN' })
          location.reload()
        }}
        title={t('Reset SmartFill?')}
        description={t("Your PIN can't be recovered. Resetting deletes your profiles and resume files and removes the PIN. Snippets, site rules and settings stay. You can restore profiles from a backup file afterwards.")}
        confirmLabel={t('Delete profiles and reset')}
        danger
      />
    </div>
  )
}

function Options() {
  const [data] = useExtensionData()
  const route = useRoute()
  const toast = useToast()

  if (!data) return <div className="min-h-screen bg-bg" aria-busy="true" />

  if (data.locked) return <LockedScreen />

  let content
  if (route.page === 'sites') content = <SitesPage data={data} />
  else if (route.page === 'snippets') content = <SnippetsPage data={data} />
  else if (route.page === 'history') content = <HistoryPage data={data} />
  else if (route.page === 'settings') content = <SettingsPage data={data} toast={toast} />
  else if (route.page === 'backup') content = <BackupPage data={data} toast={toast} />
  else if (route.page === 'about') content = <AboutPage />
  else {
    const profile = data.profiles.find((p) => p.id === route.id) || data.profiles.find((p) => p.id === data.activeId) || data.profiles[0]
    content = profile ? <ProfilePage key={profile.id} data={data} profile={profile} toast={toast} /> : null
  }

  return (
    <div className="min-h-screen bg-bg text-fg md:flex">
      <Sidebar data={data} route={route} />
      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-10">{content}</div>
      </main>
    </div>
  )
}

try {
  chrome.storage.onChanged.addListener((c, area) => {
    if (area === 'local' && 'language' in c) location.reload()
  })
} catch {}

initLanguage().then(() =>
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ToastProvider>
        <Options />
      </ToastProvider>
    </React.StrictMode>
  )
)
