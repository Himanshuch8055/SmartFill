import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import {
  Wand2, Undo2, Settings, ChevronDown, Check, Globe, ShieldOff, ShieldAlert, Pin, PinOff, Power,
  UserPlus, Users, CheckCircle2, AlertCircle, Star, X, MousePointerClick,
} from 'lucide-react'
import {
  initTheme, Button, IconButton, Switch, Badge, Kbd, Logo, DropdownMenu, ToastProvider, useToast, cn,
} from '../ui'
import { reviewUrl } from '../lib/links'

initTheme()

const RATING_PROMPT_AFTER = 20
const send = (msg) => chrome.runtime.sendMessage(msg)

function hasProfileData(profile) {
  const data = profile?.data || {}
  return Object.entries(data).some(([k, v]) => k !== 'customFields' && typeof v === 'string' && v.trim())
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// ---------- data ----------

function usePopupState() {
  const [state, setState] = React.useState({ loading: true })

  const load = React.useCallback(async () => {
    try {
      const [tab, prof, local] = await Promise.all([
        send({ type: 'GET_TAB_STATE' }),
        send({ type: 'GET_PROFILES' }),
        chrome.storage.local.get(['popupProfileIds', 'fillMode', 'fillCount', 'ratingPromptDone']),
      ])
      setState({
        loading: false,
        host: tab?.host || '',
        restricted: !!tab?.restricted,
        fieldCount: tab?.fieldCount ?? null,
        blocked: !!tab?.blocked,
        siteProfileId: tab?.siteProfileId || '',
        profiles: prof?.profiles || [],
        activeId: prof?.activeProfileId || '',
        popupProfileIds: Array.isArray(local.popupProfileIds) ? local.popupProfileIds : [],
        preview: local.fillMode !== 'instant',
        showRating: !local.ratingPromptDone && (local.fillCount || 0) >= RATING_PROMPT_AFTER,
      })
    } catch (e) {
      setState({ loading: false, error: e?.message || 'Could not load SmartFill' })
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  return [state, setState, load]
}

// ---------- pieces ----------

function ProfileSwitcher({ profiles, activeId, popupProfileIds, onSwitch }) {
  const visible = popupProfileIds.length ? profiles.filter((p) => popupProfileIds.includes(p.id) || p.id === activeId) : profiles
  const active = profiles.find((p) => p.id === activeId)
  const items = [
    ...visible.map((p) => ({
      label: p.name || 'Profile',
      icon: p.id === activeId ? Check : undefined,
      onSelect: () => onSwitch(p.id),
    })),
    'separator',
    { label: 'Manage profiles…', icon: Users, onSelect: () => chrome.runtime.openOptionsPage() },
  ]
  return (
    <DropdownMenu
      label="Switch profile"
      trigger={
        <button
          type="button"
          aria-label={`Profile: ${active?.name || 'Profile'}. Switch profile`}
          title="Switch profile (Alt+Shift+P)"
          className="h-8 max-w-[150px] inline-flex items-center gap-1.5 pl-2.5 pr-2 rounded-lg text-[13px] font-medium text-fg hover:bg-surface-2 outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
        >
          <span className="truncate">{active?.name || 'Profile'}</span>
          <ChevronDown size={14} className="text-fg-subtle shrink-0" aria-hidden />
        </button>
      }
      items={items}
    />
  )
}

function SiteCard({ state, onTurnOn }) {
  const { host, restricted, blocked, fieldCount, siteProfileId, profiles } = state
  const pinned = profiles.find((p) => p.id === siteProfileId)

  let icon = Globe
  let tone = 'text-fg-muted bg-surface-2'
  let title = host
  let detail
  if (restricted) {
    icon = ShieldAlert
    title = 'This page is protected'
    detail = "Browsers don't let extensions fill forms on this page."
  } else if (blocked) {
    icon = ShieldOff
    tone = 'text-danger bg-danger-subtle'
    detail = 'SmartFill is turned off on this site.'
  } else if (fieldCount > 0) {
    tone = 'text-accent-text bg-accent-subtle'
    detail = (
      <>
        <span className="font-semibold text-fg">{plural(fieldCount, 'field')}</span> ready to fill
      </>
    )
  } else if (fieldCount === 0) {
    detail = 'No fillable fields found on this page.'
  } else {
    detail = 'Reload the page if SmartFill misses its fields.'
  }
  const Icon = icon

  return (
    <div className="rounded-xl border border-line bg-surface p-3.5 flex items-start gap-3">
      <div className={cn('h-9 w-9 shrink-0 rounded-lg grid place-items-center', tone)}>
        <Icon size={18} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg truncate" title={title}>{title}</p>
        <p className="text-[13px] text-fg-muted mt-0.5">{detail}</p>
        {pinned && !blocked && !restricted && (
          <Badge tone="accent" icon={Pin} className="mt-2">Uses {pinned.name} here</Badge>
        )}
        {blocked && (
          <Button size="sm" variant="secondary" icon={Power} className="mt-2.5" onClick={onTurnOn}>
            Turn on for this site
          </Button>
        )}
      </div>
    </div>
  )
}

function SetupCard() {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface p-5 text-center">
      <div className="h-10 w-10 mx-auto rounded-full bg-accent-subtle text-accent-text grid place-items-center">
        <UserPlus size={20} aria-hidden />
      </div>
      <p className="mt-3 text-sm font-semibold text-fg">Add your details to start</p>
      <p className="mt-1 text-[13px] text-fg-muted">Takes a minute. Everything stays in this browser.</p>
      <Button
        variant="primary"
        className="mt-4"
        onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })}
      >
        Set up my profile
      </Button>
    </div>
  )
}

function RatingCard({ onDone }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-accent-subtle px-3 py-2.5">
      <Star size={16} className="text-accent-text shrink-0" aria-hidden />
      <p className="flex-1 text-[13px] text-fg">Enjoying SmartFill? A rating helps others find it.</p>
      <Button size="sm" variant="primary" onClick={() => onDone(true)}>Rate</Button>
      <IconButton icon={X} label="Dismiss" size="sm" onClick={() => onDone(false)} />
    </div>
  )
}

// ---------- app ----------

function Popup() {
  const toast = useToast()
  const [state, setState, reload] = usePopupState()
  const [busy, setBusy] = React.useState(false)

  const active = state.profiles?.find((p) => p.id === state.activeId)
  const fillProfile = state.profiles?.find((p) => p.id === (state.siteProfileId || state.activeId))
  const needsSetup = !state.loading && state.profiles && !hasProfileData(fillProfile)
  const canFill = !state.loading && !state.restricted && !state.blocked && !needsSetup

  const fail = (message) => toast({ title: message || 'Something went wrong', tone: 'danger', icon: AlertCircle })

  const fill = React.useCallback(async () => {
    if (!canFill || busy) return
    setBusy(true)
    try {
      const res = await send({ type: 'AUTOFILL_ACTIVE' })
      if (!res?.ok) return fail(res?.error)
      if (res.preview) {
        // The preview is on the page; close so it gets focus (Enter / Esc work there).
        toast({ title: `Review ${plural(res.count, 'field')} on the page`, icon: MousePointerClick })
        setTimeout(() => window.close(), 350)
      } else if (res.filled) {
        toast({
          title: `Filled ${plural(res.filled, 'field')}`,
          tone: 'success',
          icon: CheckCircle2,
          duration: 8000,
          action: { label: 'Undo', onClick: undo },
        })
      } else {
        toast({ title: 'No fillable fields found', description: 'Try right-clicking a field instead.' })
      }
    } catch (e) {
      fail(e?.message)
    } finally {
      setBusy(false)
    }
  }, [canFill, busy])

  async function undo() {
    try {
      const res = await send({ type: 'UNDO_ACTIVE' })
      if (!res?.ok) return fail(res?.error)
      toast({ title: res.restored ? `Restored ${plural(res.restored, 'field')}` : 'Nothing to undo', icon: Undo2 })
    } catch (e) {
      fail(e?.message)
    }
  }

  // Enter fills, Escape closes (unless a menu or input is handling the key).
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented) return
      const inMenu = e.target.closest?.('[role="menu"], [role="menuitem"], [aria-haspopup]')
      if (e.key === 'Enter' && !inMenu && e.target.tagName !== 'BUTTON') { e.preventDefault(); fill() }
      if (e.key === 'Escape' && !inMenu) window.close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fill])

  const switchProfile = async (id) => {
    setState((s) => ({ ...s, activeId: id }))
    await send({ type: 'SET_ACTIVE_PROFILE', id })
    const name = state.profiles.find((p) => p.id === id)?.name
    if (state.siteProfileId && state.siteProfileId !== id) {
      const pinned = state.profiles.find((p) => p.id === state.siteProfileId)?.name
      toast({ title: `Switched to ${name}`, description: `${state.host} still uses ${pinned}.` })
    } else {
      toast({ title: `Switched to ${name}` })
    }
  }

  const setPreview = async (on) => {
    setState((s) => ({ ...s, preview: on }))
    await chrome.storage.local.set({ fillMode: on ? 'preview' : 'instant' })
  }

  const setBlocked = async (blocked) => {
    await send({ type: 'SET_SITE_BLOCKED', host: state.host, blocked })
    await reload()
    toast({ title: blocked ? `Turned off on ${state.host}` : `Turned on for ${state.host}`, icon: blocked ? ShieldOff : Power })
  }

  const togglePin = async () => {
    const pin = !state.siteProfileId
    await send({ type: 'SET_SITE_PROFILE', host: state.host, profileId: pin ? state.activeId : '' })
    await reload()
    toast({ title: pin ? `${active?.name} will always be used on ${state.host}` : `${state.host} now uses your active profile`, icon: pin ? Pin : PinOff })
  }

  const rated = (rate) => {
    chrome.storage.local.set({ ratingPromptDone: true })
    setState((s) => ({ ...s, showRating: false }))
    if (rate) chrome.tabs.create({ url: reviewUrl() })
  }

  return (
    <div className="w-[360px] bg-bg text-fg">
      <header className="h-14 px-3.5 flex items-center gap-2 border-b border-line bg-surface">
        <Logo size={22} />
        <span className="text-[15px] font-semibold tracking-tight mr-auto">SmartFill</span>
        {state.profiles?.length > 0 && (
          <ProfileSwitcher profiles={state.profiles} activeId={state.activeId} popupProfileIds={state.popupProfileIds} onSwitch={switchProfile} />
        )}
        <IconButton icon={Settings} label="Settings" size="sm" onClick={() => chrome.runtime.openOptionsPage()} />
      </header>

      <main className="p-3.5 space-y-3">
        {state.loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading">
            <div className="h-[74px] rounded-xl bg-surface-2 animate-pulse" />
            <div className="h-11 rounded-xl bg-surface-2 animate-pulse" />
          </div>
        ) : state.error ? (
          <div className="rounded-xl border border-danger/40 bg-danger-subtle p-3.5 text-[13px] text-danger flex gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden />
            {state.error}
          </div>
        ) : needsSetup ? (
          <SetupCard />
        ) : (
          <>
            {(state.host || state.restricted) && <SiteCard state={state} onTurnOn={() => setBlocked(false)} />}

            <Button variant="primary" size="lg" fullWidth icon={Wand2} loading={busy} disabled={!canFill} onClick={fill}>
              {busy ? 'Filling…' : 'Fill form'}
            </Button>

            <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
              <Switch
                size="sm"
                checked={state.preview}
                onChange={setPreview}
                label="Preview before filling"
                description={state.preview ? 'Review fields on the page, then confirm.' : 'Fills immediately. You can still undo.'}
              />
            </div>
          </>
        )}

        {state.showRating && <RatingCard onDone={rated} />}
      </main>

      {!state.loading && !state.error && !needsSetup && (
        <footer className="px-2 pb-2 flex items-center gap-1 border-t border-line pt-2">
          <Button variant="ghost" size="sm" icon={Undo2} onClick={undo} disabled={state.restricted}>
            Undo
          </Button>
          {state.host && !state.blocked && (
            <Button variant="ghost" size="sm" icon={ShieldOff} onClick={() => setBlocked(true)}>
              Off here
            </Button>
          )}
          {state.host && !state.blocked && state.profiles.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              icon={state.siteProfileId ? PinOff : Pin}
              onClick={togglePin}
              title={state.siteProfileId ? 'Stop using a fixed profile on this site' : `Always use ${active?.name} on this site`}
              className="ml-auto"
            >
              {state.siteProfileId ? 'Unpin' : 'Pin profile'}
            </Button>
          )}
        </footer>
      )}

      <p className="px-3.5 pb-3 pt-1 text-[11px] text-fg-subtle flex items-center gap-1.5">
        <Kbd keys={['Alt', 'Shift', 'F']} /> to fill
        <span aria-hidden>·</span>
        Right-click any field to fill it
      </p>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <Popup />
    </ToastProvider>
  </React.StrictMode>
)
