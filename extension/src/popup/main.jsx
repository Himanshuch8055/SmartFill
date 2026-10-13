import React from 'react'
import { createRoot } from 'react-dom/client'
import { filledAgo } from '../lib/time'
import '../styles.css'
import { Settings, ChevronDown, Check, Lock } from 'lucide-react'
import { initTheme, IconButton, Switch, DropdownMenu, UnlockForm, cn } from '../ui'
import { reviewUrl, reportSiteUrl } from '../lib/links'
import { t, tn, initLanguage } from '../lib/i18n'

initTheme()

const RATING_PROMPT_AFTER = 20
const send = (msg) => chrome.runtime.sendMessage(msg)

function hasProfileData(profile) {
  const data = profile?.data || {}
  return Object.entries(data).some(([k, v]) => k !== 'customFields' && typeof v === 'string' && v.trim())
}

// ---------- data ----------

function usePopupState() {
  const [state, setState] = React.useState({ loading: true })

  const load = React.useCallback(async () => {
    try {
      const lock = await send({ type: 'GET_LOCK_STATE' })
      if (lock?.locked) return setState({ loading: false, locked: true })
      const [tab, prof, local] = await Promise.all([
        send({ type: 'GET_TAB_STATE' }),
        send({ type: 'GET_PROFILES' }),
        chrome.storage.local.get(['popupProfileIds', 'fillMode', 'fillCount', 'ratingPromptDone', 'fillHistory', 'testDataEnabled']),
      ])
      setState({
        loading: false,
        lockEnabled: !!lock?.enabled,
        host: tab?.host || '',
        restricted: !!tab?.restricted,
        fieldCount: tab?.fieldCount ?? null,
        blocked: !!tab?.blocked,
        siteProfileId: tab?.siteProfileId || '',
        profiles: prof?.profiles || [],
        activeId: prof?.activeProfileId || '',
        popupProfileIds: Array.isArray(local.popupProfileIds) ? local.popupProfileIds : [],
        preview: local.fillMode !== 'instant',
        lastFilledAt: (Array.isArray(local.fillHistory) ? local.fillHistory : []).find((e) => e.host === tab?.host)?.at || 0,
        testData: local.testDataEnabled === true,
        showRating: !local.ratingPromptDone && (local.fillCount || 0) >= RATING_PROMPT_AFTER,
      })
    } catch (e) {
      setState({ loading: false, error: e?.message || t('SmartFill could not load.') })
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  return [state, setState, load]
}

// One line of feedback under the main button, instead of pop-up toasts.
function useNotice() {
  const [notice, setNotice] = React.useState(null)
  const timer = React.useRef(0)
  const show = React.useCallback((text, { tone = 'neutral', action } = {}) => {
    clearTimeout(timer.current)
    setNotice({ text, tone, action })
    timer.current = setTimeout(() => setNotice(null), action ? 8000 : 4000)
  }, [])
  return [notice, show]
}

// ---------- pieces ----------

function ProfileMenu({ profiles, activeId, popupProfileIds, onSwitch }) {
  const visible = popupProfileIds.length ? profiles.filter((p) => popupProfileIds.includes(p.id) || p.id === activeId) : profiles
  const active = profiles.find((p) => p.id === activeId)
  return (
    <DropdownMenu
      label={t('Switch profile')}
      trigger={
        <button
          type="button"
          aria-label={t('Profile: {name}. Switch profile', { name: active?.name || t('Profile') })}
          title={t('Switch profile ({shortcut})', { shortcut: 'Alt+Shift+P' })}
          className="h-7 max-w-[140px] inline-flex items-center gap-1 px-2 -mr-1 rounded-md text-[13px] text-fg-muted hover:text-fg hover:bg-surface-2 outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
        >
          <span className="truncate">{active?.name || t('Profile')}</span>
          <ChevronDown size={13} className="shrink-0 opacity-70" aria-hidden />
        </button>
      }
      items={[
        ...visible.map((p) => ({
          label: p.name || t('Profile'),
          icon: p.id === activeId ? Check : () => <span className="w-[15px]" />,
          onSelect: () => onSwitch(p.id),
        })),
        'separator',
        { label: t('Manage profiles'), onSelect: () => chrome.runtime.openOptionsPage() },
      ]}
    />
  )
}

// A settings-style row: label on the left, control on the right.
function Row({ children, className }) {
  return <div className={cn('flex items-center justify-between gap-4 px-4 h-11 text-[13px]', className)}>{children}</div>
}

function LinkButton({ className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'text-[13px] text-fg-muted hover:text-fg underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline rounded outline-none focus-visible:ring-2 focus-visible:ring-focus/60',
        className
      )}
      {...props}
    />
  )
}

// ---------- app ----------

function Popup() {
  const [state, setState, reload] = usePopupState()
  const [notice, notify] = useNotice()
  const [busy, setBusy] = React.useState(false)

  const fillProfile = state.profiles?.find((p) => p.id === (state.siteProfileId || state.activeId))
  const needsSetup = !state.loading && !state.error && !state.locked && !hasProfileData(fillProfile)
  const canFill = !state.loading && !state.error && !state.restricted && !state.blocked && !needsSetup

  async function undo() {
    try {
      const res = await send({ type: 'UNDO_ACTIVE' })
      if (!res?.ok) return notify(res?.error || t('Could not undo.'), { tone: 'danger' })
      notify(res.restored ? tn(res.restored, 'Restored {n} field.', 'Restored {n} fields.') : t('Nothing to undo.'))
    } catch (e) {
      notify(e?.message || t('Could not undo.'), { tone: 'danger' })
    }
  }

  const fill = React.useCallback(async (withTestData) => {
    if (!canFill || busy) return
    setBusy(true)
    try {
      const res = await send({ type: 'AUTOFILL_ACTIVE', testData: withTestData === true })
      if (!res?.ok) return notify(res?.error || t('Something went wrong.'), { tone: 'danger' })
      if (res.preview) {
        // The preview is on the page; close so it gets focus (Enter / Esc work there).
        notify(tn(res.count, 'Review {n} field on the page.', 'Review {n} fields on the page.'))
        setTimeout(() => window.close(), 300)
      } else if (res.filled) {
        notify(tn(res.filled, 'Filled {n} field.', 'Filled {n} fields.'), { tone: 'success', action: { label: t('Undo'), onClick: undo } })
      } else {
        notify(t('No fields to fill. Try right-clicking a field.'))
      }
    } catch (e) {
      notify(e?.message || t('Something went wrong.'), { tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }, [canFill, busy])

  // Enter fills, Escape closes (menus handle their own keys).
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.target.closest?.('[role="menu"], [aria-haspopup]')) return
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); fill() }
      if (e.key === 'Escape') window.close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fill])

  const switchProfile = async (id) => {
    setState((s) => ({ ...s, activeId: id }))
    await send({ type: 'SET_ACTIVE_PROFILE', id })
    if (state.siteProfileId && state.siteProfileId !== id) {
      const pinned = state.profiles.find((p) => p.id === state.siteProfileId)?.name
      notify(t('{host} still uses {name}.', { host: state.host, name: pinned }))
    }
  }

  const setPreview = async (on) => {
    setState((s) => ({ ...s, preview: on }))
    await chrome.storage.local.set({ fillMode: on ? 'preview' : 'instant' })
  }

  const setEnabledHere = async (enabled) => {
    setState((s) => ({ ...s, blocked: !enabled }))
    await send({ type: 'SET_SITE_BLOCKED', host: state.host, blocked: !enabled })
    reload()
  }

  const rated = (rate) => {
    chrome.storage.local.set({ ratingPromptDone: true })
    setState((s) => ({ ...s, showRating: false }))
    if (rate) chrome.tabs.create({ url: reviewUrl() })
  }

  // What the page section says
  let status = null
  if (state.restricted) status = t("SmartFill can't run on this page.")
  else if (state.blocked) status = t('Turned off on this site.')
  else if (state.fieldCount > 0) status = tn(state.fieldCount, '{n} field detected', '{n} fields detected')
  else if (state.fieldCount === 0) status = t('No form fields detected')
  else status = t('Reload the page if fields are missed')

  const pinnedProfile = state.profiles?.find((p) => p.id === state.siteProfileId)
  const buttonLabel = busy ? t('Filling…') : state.fieldCount > 0 && canFill ? tn(state.fieldCount, 'Fill {n} field', 'Fill {n} fields') : t('Fill this page')

  return (
    <div className="w-[340px] bg-surface text-fg">
      <header className="h-12 px-4 flex items-center gap-2 border-b border-line">
        <span className="text-[14px] font-semibold tracking-[-0.01em] mr-auto">SmartFill</span>
        {state.profiles?.length > 0 && (
          <ProfileMenu profiles={state.profiles} activeId={state.activeId} popupProfileIds={state.popupProfileIds} onSwitch={switchProfile} />
        )}
        {state.lockEnabled && (
          <IconButton icon={Lock} label={t('Lock now')} size="sm" onClick={async () => { await send({ type: 'LOCK_NOW' }); reload() }} />
        )}
        <IconButton icon={Settings} label={t('Settings')} size="sm" className="-mr-2" onClick={() => chrome.runtime.openOptionsPage()} />
      </header>

      <main>
      {state.loading ? (
        <div className="px-4 py-5 space-y-3" aria-busy="true" aria-label={t('Loading')}>
          <div className="h-4 w-40 rounded bg-surface-2" />
          <div className="h-9 rounded-lg bg-surface-2" />
        </div>
      ) : state.locked ? (
        <UnlockForm className="px-4 py-4" onUnlocked={reload} onForgot={() => chrome.runtime.openOptionsPage()} />
      ) : state.error ? (
        <p className="px-4 py-5 text-[13px] text-danger">{state.error}</p>
      ) : needsSetup ? (
        <div className="px-4 py-5">
          <p className="text-[14px] font-medium">{t('Add your details first')}</p>
          <p className="mt-1 text-[13px] text-fg-muted leading-relaxed">
            {t('SmartFill fills forms from a profile you save once. It stays in this browser.')}
          </p>
          <button
            type="button"
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })}
            className="mt-4 h-9 w-full rounded-lg bg-accent text-accent-fg text-[13px] font-medium hover:bg-accent-hover outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t('Set up profile')}
          </button>
        </div>
      ) : (
        <>
          <section className="px-4 py-4">
            {state.host && <p className="text-[14px] font-medium truncate" title={state.host}>{state.host}</p>}
            <p className="text-[13px] mt-0.5 text-fg-muted">
              {pinnedProfile && canFill ? t('{status} · uses {name}', { status, name: pinnedProfile.name }) : status}
              {state.fieldCount === 0 && state.host && !state.blocked && (
                <>
                  {' · '}
                  <LinkButton
                    className="text-[13px] text-accent-text hover:text-accent-text"
                    onClick={() => chrome.tabs.create({ url: reportSiteUrl(state.host, chrome.runtime.getManifest?.().version) })}
                  >
                    {t('Report this site')}
                  </LinkButton>
                </>
              )}
            </p>
            {state.lastFilledAt > 0 && <p className="text-[12px] mt-0.5 text-fg-subtle">{filledAgo(state.lastFilledAt)}</p>}

            <button
              type="button"
              onClick={fill}
              disabled={!canFill || busy}
              className="mt-3.5 h-9 w-full rounded-lg bg-accent text-accent-fg text-[13px] font-medium transition-colors hover:bg-accent-hover disabled:bg-surface-2 disabled:text-fg-subtle outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {buttonLabel}
            </button>

            <div aria-live="polite">
              {notice && (
                <p className={cn('mt-2.5 text-[12px] flex items-center gap-2', notice.tone === 'danger' ? 'text-danger' : notice.tone === 'success' ? 'text-success' : 'text-fg-muted')}>
                  {notice.text}
                  {notice.action && (
                    <LinkButton className="text-accent-text hover:text-accent-text font-medium" onClick={notice.action.onClick}>
                      {notice.action.label}
                    </LinkButton>
                  )}
                </p>
              )}
            </div>
          </section>

          <div className="border-t border-line divide-y divide-line">
            <Row>
              <label htmlFor="sf-preview" className="cursor-pointer">{t('Preview before filling')}</label>
              <Switch id="sf-preview" size="sm" checked={state.preview} onChange={setPreview} />
            </Row>
            {state.host && (
              <Row>
                <label htmlFor="sf-site" className="cursor-pointer truncate">{t('Enabled on this site')}</label>
                <Switch id="sf-site" size="sm" checked={!state.blocked} onChange={setEnabledHere} />
              </Row>
            )}
          </div>
        </>
      )}

      {state.showRating && (
        <div className="border-t border-line px-4 py-3 text-[12px] text-fg-muted flex items-center gap-3">
          <span className="mr-auto">{t('Finding SmartFill useful?')}</span>
          <LinkButton className="text-accent-text font-medium" onClick={() => rated(true)}>{t('Leave a rating')}</LinkButton>
          <LinkButton onClick={() => rated(false)}>{t('Not now')}</LinkButton>
        </div>
      )}
      </main>

      {!state.loading && !state.error && !state.locked && !needsSetup && (
        <footer className="border-t border-line px-4 h-10 flex items-center justify-between">
          <LinkButton onClick={undo} disabled={state.restricted}>{t('Undo last fill')}</LinkButton>
          {state.testData ? (
            <LinkButton onClick={() => fill(true)} disabled={!canFill || busy}>{t('Fill with test data')}</LinkButton>
          ) : (
            <span className="text-[12px] text-fg-subtle" title={t('Change shortcuts at {url}', { url: 'chrome://extensions/shortcuts' })}>Alt+Shift+F</span>
          )}
        </footer>
      )}
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
      <Popup />
    </React.StrictMode>
  )
)
