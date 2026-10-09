import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import { Plus } from 'lucide-react'
import { initTheme, IconButton, ToastProvider, useToast, cn } from '../ui'
import { useExtensionData, useRoute, send, go } from './data'
import ProfilePage from './ProfilePage'
import SitesPage from './SitesPage'
import SettingsPage from './SettingsPage'
import BackupPage from './BackupPage'
import AboutPage from './AboutPage'

initTheme()

const PAGES = [
  { id: 'sites', label: 'Sites' },
  { id: 'settings', label: 'Settings' },
  { id: 'backup', label: 'Backup' },
  { id: 'about', label: 'About' },
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
    const res = await send({ type: 'CREATE_PROFILE', name: 'New profile', data: {} })
    if (res?.id) go(`/profile/${res.id}`)
  }
  const openId = route.page === 'profile' ? route.id || data.activeId : ''

  return (
    <nav aria-label="Settings" className="md:w-56 md:shrink-0 md:h-screen md:sticky md:top-0 md:border-r border-b md:border-b-0 border-line bg-surface md:flex md:flex-col">
      <div className="h-12 md:h-14 px-5 flex items-center">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">SmartFill</span>
      </div>

      {/* Wide screens: vertical sidebar. Narrow screens: one horizontally scrolling row. */}
      <div className="px-3 pb-2 md:pb-3 md:flex-1 md:overflow-y-auto flex md:block gap-1 overflow-x-auto">
        <div className="hidden md:flex items-center justify-between px-2.5 mt-1 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Profiles</span>
          <IconButton icon={Plus} label="New profile" size="sm" className="h-6 w-6 -mr-1" onClick={createProfile} />
        </div>
        <div className="flex md:block gap-1 md:space-y-0.5 shrink-0">
          {data.profiles.map((p) => (
            <NavItem
              key={p.id}
              active={openId === p.id}
              onClick={() => go(`/profile/${p.id}`)}
              trailing={p.id === data.activeId && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" title="Active profile" aria-label="Active" />}
            >
              {p.name || 'Profile'}
            </NavItem>
          ))}
          <IconButton icon={Plus} label="New profile" size="sm" className="md:hidden shrink-0" onClick={createProfile} />
        </div>
        <span aria-hidden className="md:hidden w-px my-1.5 bg-line shrink-0" />
        <div className="flex md:block gap-1 md:mt-6 md:space-y-0.5 shrink-0">
          {PAGES.map((pg) => (
            <NavItem key={pg.id} active={route.page === pg.id} onClick={() => go(`/${pg.id}`)}>
              {pg.label}
            </NavItem>
          ))}
        </div>
      </div>
    </nav>
  )
}

function Options() {
  const [data] = useExtensionData()
  const route = useRoute()
  const toast = useToast()

  if (!data) return <div className="min-h-screen bg-bg" aria-busy="true" />

  let content
  if (route.page === 'sites') content = <SitesPage data={data} />
  else if (route.page === 'settings') content = <SettingsPage data={data} />
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

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <Options />
    </ToastProvider>
  </React.StrictMode>
)
