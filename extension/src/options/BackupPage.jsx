import React from 'react'
import { Button, Dialog } from '../ui'
import { send } from './data'
import { PageHeader, Group, SettingRow } from './layout'

function summarize(payload) {
  const n = (x) => (Array.isArray(x) ? x.length : x && typeof x === 'object' ? Object.keys(x).length : 0)
  const parts = [`${n(payload.profiles)} profile${n(payload.profiles) === 1 ? '' : 's'}`]
  if (payload.version >= 2) {
    if (n(payload.rules)) parts.push(`${n(payload.rules)} remembered field${n(payload.rules) === 1 ? '' : 's'}`)
    if (n(payload.blockedSites)) parts.push(`${n(payload.blockedSites)} turned-off site${n(payload.blockedSites) === 1 ? '' : 's'}`)
    if (payload.settings) parts.push('settings')
  }
  return parts
}

export default function BackupPage({ data, toast }) {
  const [pending, setPending] = React.useState(null) // { payload, fileName }
  const [error, setError] = React.useState('')
  const fileRef = React.useRef(null)

  const exportBackup = async () => {
    const res = await send({ type: 'EXPORT_PROFILES' })
    if (!res?.ok) return toast({ title: "Couldn't create the backup", tone: 'danger' })
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
      setError(`${file.name} isn't a SmartFill backup file.`)
    }
  }

  const restore = async () => {
    const res = await send({ type: 'IMPORT_PROFILES', payload: pending.payload })
    setPending(null)
    if (res?.ok) toast({ title: 'Backup restored', tone: 'success' })
    else toast({ title: res?.error || "Couldn't restore the backup", tone: 'danger' })
  }

  return (
    <div>
      <PageHeader title="Backup" description="Your data lives only in this browser. Keep a backup file to move it to another browser or restore it later." />

      <Group>
        <SettingRow
          label="Export backup"
          description={`Profiles (${data.profiles.length}), remembered fields, site settings and preferences, as a JSON file.`}
        >
          <Button size="sm" onClick={exportBackup}>Export</Button>
        </SettingRow>
        <SettingRow label="Restore from file" description="Replaces your current profiles and settings with the ones in the file.">
          <Button size="sm" onClick={() => fileRef.current?.click()}>Choose file…</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickFile} />
        </SettingRow>
      </Group>
      {error && <p className="-mt-6 mb-8 text-[12px] text-danger">{error}</p>}

      <p className="text-[12px] text-fg-muted">Backup files aren't encrypted. Store them somewhere private.</p>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Restore this backup?"
        description="Your current profiles and settings will be replaced."
        size="sm"
        footer={
          <>
            <Button onClick={() => setPending(null)} data-autofocus>Cancel</Button>
            <Button variant="primary" onClick={restore}>Restore</Button>
          </>
        }
      >
        {pending && (
          <div className="text-[13px]">
            <p className="text-fg-muted">{pending.fileName} contains:</p>
            <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
              {summarize(pending.payload).map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        )}
      </Dialog>
    </div>
  )
}
