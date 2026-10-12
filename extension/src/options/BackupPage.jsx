import React from 'react'
import { Button, Dialog } from '../ui'
import { send } from './data'
import { PageHeader, Group, SettingRow } from './layout'
import { t, tn } from '../lib/i18n'

function summarize(payload) {
  const n = (x) => (Array.isArray(x) ? x.length : x && typeof x === 'object' ? Object.keys(x).length : 0)
  const parts = [tn(n(payload.profiles), '{n} profile', '{n} profiles')]
  if (payload.version >= 2) {
    if (n(payload.rules)) parts.push(tn(n(payload.rules), '{n} remembered field', '{n} remembered fields'))
    if (n(payload.blockedSites)) parts.push(tn(n(payload.blockedSites), '{n} turned-off site', '{n} turned-off sites'))
    if (payload.settings) parts.push(t('settings'))
  }
  return parts
}

export default function BackupPage({ data, toast }) {
  const [pending, setPending] = React.useState(null) // { payload, fileName }
  const [error, setError] = React.useState('')
  const fileRef = React.useRef(null)

  const exportBackup = async () => {
    const res = await send({ type: 'EXPORT_PROFILES' })
    if (!res?.ok) return toast({ title: t("Couldn't create the backup"), tone: 'danger' })
    const blob = new Blob([JSON.stringify(res.payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smartfill-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      const payload = JSON.parse(await file.text())
      if (!Array.isArray(payload?.profiles)) throw new Error('not a backup')
      setPending({ payload, fileName: file.name })
    } catch {
      setError(t("{name} isn't a SmartFill backup file.", { name: file.name }))
    }
  }

  const restore = async () => {
    const res = await send({ type: 'IMPORT_PROFILES', payload: pending.payload })
    setPending(null)
    if (res?.ok) toast({ title: t('Backup restored'), tone: 'success' })
    else toast({ title: res?.error || t("Couldn't restore the backup"), tone: 'danger' })
  }

  return (
    <div>
      <PageHeader title={t('Backup')} description={t('Your data lives only in this browser. Keep a backup file to move it to another browser or restore it later.')} />

      <Group>
        <SettingRow
          label={t('Export backup')}
          description={t('Profiles ({count}), remembered fields, site settings and preferences, as a JSON file.', { count: data.profiles.length })}
        >
          <Button size="sm" onClick={exportBackup}>{t('Export')}</Button>
        </SettingRow>
        <SettingRow label={t('Restore from file')} description={t('Replaces your current profiles and settings with the ones in the file.')}>
          <Button size="sm" onClick={() => fileRef.current?.click()}>{t('Choose file…')}</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label={t('Backup file to restore')} onChange={pickFile} />
        </SettingRow>
      </Group>
      {error && <p className="-mt-6 mb-8 text-[12px] text-danger">{error}</p>}

      <p className="text-[12px] text-fg-muted">{t("Backup files aren't encrypted. Store them somewhere private.")}</p>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={t('Restore this backup?')}
        description={t('Your current profiles and settings will be replaced.')}
        size="sm"
        footer={
          <>
            <Button onClick={() => setPending(null)} data-autofocus>{t('Cancel')}</Button>
            <Button variant="primary" onClick={restore}>{t('Restore')}</Button>
          </>
        }
      >
        {pending && (
          <div className="text-[13px]">
            <p className="text-fg-muted">{t('{name} contains:', { name: pending.fileName })}</p>
            <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
              {summarize(pending.payload).map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        )}
      </Dialog>
    </div>
  )
}
