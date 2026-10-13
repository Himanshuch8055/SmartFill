// PIN entry shown while SmartFill is locked (popup and settings).
import React from 'react'
import { Lock } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Form'
import { t } from '../lib/i18n'

export function UnlockForm({ onUnlocked, onForgot, className = '' }) {
  const [pin, setPin] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [waitUntil, setWaitUntil] = React.useState(0)
  const [, tick] = React.useState(0)

  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_LOCK_STATE' }).then((s) => s?.waitMs && setWaitUntil(Date.now() + s.waitMs)).catch(() => {})
  }, [])
  React.useEffect(() => {
    if (waitUntil <= Date.now()) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [waitUntil])

  const waitSeconds = Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000))

  const submit = async (e) => {
    e.preventDefault()
    if (!pin || busy || waitSeconds) return
    setBusy(true)
    setError('')
    try {
      const res = await chrome.runtime.sendMessage({ type: 'UNLOCK', pin })
      if (res?.ok) return onUnlocked?.()
      setPin('')
      if (res?.reason === 'wait') setWaitUntil(Date.now() + res.waitMs)
      else setError(t('Wrong PIN. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex items-center gap-2 text-[14px] font-medium">
        <Lock size={15} className="text-fg-muted" aria-hidden /> {t('SmartFill is locked')}
      </div>
      <p className="mt-1 text-[13px] text-fg-muted">{t('Enter your PIN to use your profiles.')}</p>
      <div className="mt-3 flex gap-2">
        <Input
          type="password"
          autoComplete="off"
          aria-label={t('PIN')}
          placeholder={t('PIN')}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="flex-1"
          autoFocus
          invalid={!!error}
        />
        <Button type="submit" variant="primary" loading={busy} disabled={!pin || !!waitSeconds}>
          {t('Unlock')}
        </Button>
      </div>
      <div aria-live="polite" className="mt-2 min-h-[18px] text-[12px]">
        {waitSeconds ? (
          <span className="text-fg-muted">{t('Too many tries. Try again in {n} s.', { n: waitSeconds })}</span>
        ) : (
          error && <span className="text-danger">{error}</span>
        )}
      </div>
      {onForgot && (
        <button type="button" onClick={onForgot} className="text-[12px] text-fg-muted hover:text-fg hover:underline underline-offset-2">
          {t('Forgot your PIN?')}
        </button>
      )}
    </form>
  )
}
