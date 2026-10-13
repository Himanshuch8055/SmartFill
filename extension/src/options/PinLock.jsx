// Settings → PIN lock: set, change or remove the PIN, auto-lock, lock now.
import React from 'react'
import { Button, Dialog, Field, Input, Checkbox, Select } from '../ui'
import { t, mark } from '../lib/i18n'
import { PIN_MIN_LENGTH } from '../lib/vault'
import { send } from './data'
import { Group, SettingRow, TextButton } from './layout'

const AUTO_LOCK = [
  { minutes: 0, label: mark('When the browser closes') },
  { minutes: 15, label: mark('After 15 minutes without use') },
  { minutes: 60, label: mark('After 1 hour without use') },
  { minutes: 240, label: mark('After 4 hours without use') },
]

function PinInput(props) {
  return <Input type="password" autoComplete="new-password" inputMode="numeric" {...props} />
}

// mode: 'set' | 'change' | 'remove'
function PinDialog({ mode, open, onClose, onDone }) {
  const [current, setCurrent] = React.useState('')
  const [pin, setPin] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [understood, setUnderstood] = React.useState(false)
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setCurrent(''); setPin(''); setConfirm(''); setUnderstood(false); setError('')
  }, [open])

  const needsNew = mode !== 'remove'
  const needsCurrent = mode !== 'set'
  const titles = { set: t('Set a PIN'), change: t('Change PIN'), remove: t('Turn off PIN lock') }

  const submit = async (e) => {
    e.preventDefault()
    if (needsNew && pin.length < PIN_MIN_LENGTH) return setError(t('Use at least {n} characters.', { n: PIN_MIN_LENGTH }))
    if (needsNew && pin !== confirm) return setError(t("The PINs don't match."))
    if (mode === 'set' && !understood) return setError(t('Please confirm you understand.'))
    setBusy(true)
    setError('')
    try {
      const msg =
        mode === 'set' ? { type: 'SET_PIN', pin } : mode === 'change' ? { type: 'CHANGE_PIN', oldPin: current, newPin: pin } : { type: 'REMOVE_PIN', pin: current }
      const res = await send(msg)
      if (res?.ok) return onDone()
      setError(res?.reason === 'wait' ? t('Too many tries. Try again in {n} s.', { n: Math.ceil(res.waitMs / 1000) }) : res?.reason === 'wrong' ? t('Wrong PIN. Try again.') : res?.error || t('Something went wrong.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={titles[mode]} size="sm">
      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === 'set' && (
          <p className="text-[13px] text-fg-muted">
            {t('Your profiles, resume files, snippets and AI key will be encrypted. You enter the PIN once, and again after SmartFill locks.')}
          </p>
        )}
        {needsCurrent && (
          <Field label={t('Current PIN')}>
            <PinInput value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
          </Field>
        )}
        {needsNew && (
          <>
            <Field label={mode === 'change' ? t('New PIN') : t('PIN')} hint={t('At least {n} digits or characters.', { n: PIN_MIN_LENGTH })}>
              <PinInput value={pin} onChange={(e) => setPin(e.target.value)} autoFocus={!needsCurrent} />
            </Field>
            <Field label={t('Confirm PIN')}>
              <PinInput value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          </>
        )}
        {mode === 'set' && (
          <Checkbox
            checked={understood}
            onChange={setUnderstood}
            label={t("I understand that if I forget the PIN, my profiles can't be recovered, only reset. I keep a backup file.")}
          />
        )}
        <p aria-live="polite" className="min-h-[18px] text-[12px] text-danger">{error}</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('Cancel')}</Button>
          <Button type="submit" variant={mode === 'remove' ? 'danger' : 'primary'} loading={busy}>
            {mode === 'set' ? t('Turn on PIN lock') : mode === 'change' ? t('Change PIN') : t('Turn off')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function PinLockSettings({ data, toast }) {
  const [dialog, setDialog] = React.useState(null)
  const done = (text) => () => {
    setDialog(null)
    toast?.({ title: text, tone: 'success' })
  }

  return (
    <Group
      title={t('PIN lock')}
      description={t('Keeps your profiles private from other people using this computer. History and site settings are not encrypted.')}
    >
      <SettingRow
        label={data.lockEnabled ? t('PIN lock is on') : t('Lock SmartFill with a PIN')}
        description={data.lockEnabled ? t('Your profiles, resume files, snippets and AI key are encrypted.') : t('Ask for a PIN before your details can be used or viewed.')}
      >
        {data.lockEnabled ? (
          <div className="flex items-center gap-3">
            <TextButton onClick={() => setDialog('change')}>{t('Change PIN')}</TextButton>
            <TextButton danger onClick={() => setDialog('remove')}>{t('Turn off')}</TextButton>
          </div>
        ) : (
          <Button size="sm" onClick={() => setDialog('set')}>{t('Set a PIN')}</Button>
        )}
      </SettingRow>
      {data.lockEnabled && (
        <SettingRow label={t('Lock automatically')} htmlFor="set-autolock">
          <div className="flex items-center gap-3">
            <Select id="set-autolock" value={data.autoLockMinutes} onChange={(e) => send({ type: 'SET_AUTO_LOCK', minutes: Number(e.target.value) })} className="w-64">
              {AUTO_LOCK.map((o) => (
                <option key={o.minutes} value={o.minutes}>{t(o.label)}</option>
              ))}
            </Select>
            <Button size="sm" onClick={() => send({ type: 'LOCK_NOW' })}>{t('Lock now')}</Button>
          </div>
        </SettingRow>
      )}
      <PinDialog mode={dialog || 'set'} open={!!dialog} onClose={() => setDialog(null)} onDone={done(dialog === 'remove' ? t('PIN lock turned off') : t('PIN saved'))} />
    </Group>
  )
}
