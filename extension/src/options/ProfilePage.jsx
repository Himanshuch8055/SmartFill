import React from 'react'
import { MoreHorizontal, Plus, X } from 'lucide-react'
import { Button, IconButton, Field, Input, Select, Textarea, DropdownMenu, ConfirmDialog, cn } from '../ui'
import { PROFILE_SECTIONS } from '../lib/profileFields'
import { send, go } from './data'
import { PageHeader, TextButton } from './layout'

const SAVE_DELAY = 500

// Edits are saved automatically shortly after typing stops.
function useAutosave(profileId) {
  const [status, setStatus] = React.useState('saved') // saved | pending | saving | error
  const pending = React.useRef(null)
  const timer = React.useRef(0)

  const flush = React.useCallback(async () => {
    clearTimeout(timer.current)
    const data = pending.current
    if (!data) return
    pending.current = null
    setStatus('saving')
    try {
      const res = await send({ type: 'UPDATE_PROFILE', id: profileId, data })
      setStatus(res?.ok ? (pending.current ? 'pending' : 'saved') : 'error')
    } catch {
      setStatus('error')
    }
  }, [profileId])

  const schedule = React.useCallback(
    (data) => {
      pending.current = data
      setStatus('pending')
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DELAY)
    },
    [flush]
  )

  // Save anything pending when switching profiles or closing the page.
  React.useEffect(() => {
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [flush])

  return { status, schedule, retry: flush }
}

function SaveStatus({ status, onRetry }) {
  if (status === 'error') {
    return (
      <span className="text-[12px] text-danger">
        Couldn't save. <TextButton className="text-danger" onClick={onRetry}>Retry</TextButton>
      </span>
    )
  }
  return (
    <span className="text-[12px] text-fg-subtle" aria-live="polite">
      {status === 'saved' ? 'All changes saved' : 'Saving…'}
    </span>
  )
}

function ProfileField({ field, value, onChange }) {
  const common = { value: value ?? '', onChange: (e) => onChange(field.name, e.target.value) }
  let control
  if (field.type === 'select') {
    control = (
      <Select {...common}>
        <option value="">Not set</option>
        {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    )
  } else if (field.type === 'textarea') {
    control = <Textarea rows={3} placeholder={field.placeholder} {...common} />
  } else {
    control = <Input type={field.type || 'text'} placeholder={field.placeholder} autoComplete="off" {...common} />
  }
  return (
    <Field label={field.label} className={field.full ? 'md:col-span-2' : ''}>
      {control}
    </Field>
  )
}

function CustomFields({ items, onChange }) {
  const update = (i, key, val) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: val } : it)))
  const remove = (i) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, { name: '', value: '' }])
  return (
    <section className="mb-10">
      <div className="mb-2">
        <h2 className="text-[13px] font-semibold">Custom fields</h2>
        <p className="text-[12px] text-fg-muted mt-0.5">
          For anything not listed above. SmartFill fills a field when its label matches the name.
        </p>
      </div>
      <div className="rounded-lg border border-line bg-surface">
        {items.length > 0 && (
          <div className="p-4 space-y-2.5">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input aria-label="Field name" placeholder="Label on the form, e.g. Nationality" value={it.name || ''} onChange={(e) => update(i, 'name', e.target.value)} />
                <Input aria-label="Value" placeholder="Value" value={it.value || ''} onChange={(e) => update(i, 'value', e.target.value)} />
                <IconButton icon={X} label="Remove field" size="sm" onClick={() => remove(i)} />
              </div>
            ))}
          </div>
        )}
        <div className={cn('px-4 py-3', items.length > 0 && 'border-t border-line')}>
          <TextButton onClick={add} className="inline-flex items-center gap-1.5 text-accent-text hover:text-accent-text">
            <Plus size={14} aria-hidden /> Add custom field
          </TextButton>
        </div>
      </div>
    </section>
  )
}

export default function ProfilePage({ data, profile, toast }) {
  const [draft, setDraft] = React.useState(profile.data || {})
  const [name, setName] = React.useState(profile.name || '')
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const draftRef = React.useRef(draft)
  const { status, schedule, retry } = useAutosave(profile.id)

  // Reset the editor only when a different profile is opened (not on our own saves).
  React.useEffect(() => {
    setDraft(profile.data || {})
    draftRef.current = profile.data || {}
    setName(profile.name || '')
  }, [profile.id])

  const change = (patch) => {
    const next = { ...draftRef.current, ...patch }
    draftRef.current = next
    setDraft(next)
    schedule(next)
  }

  const rename = async () => {
    const next = name.trim() || 'Profile'
    setName(next)
    if (next !== profile.name) await send({ type: 'RENAME_PROFILE', id: profile.id, name: next })
  }

  const isActive = profile.id === data.activeId
  const onlyProfile = data.profiles.length < 2

  const actions = [
    { label: 'Duplicate', onSelect: async () => {
      const res = await send({ type: 'DUPLICATE_PROFILE', id: profile.id })
      if (res?.id) go(`/profile/${res.id}`)
    } },
    ...(onlyProfile ? [] : ['separator', { label: 'Delete profile…', danger: true, onSelect: () => setConfirmDelete(true) }]),
  ]

  return (
    <div>
      <PageHeader
        actions={
          <>
            <SaveStatus status={status} onRetry={retry} />
            {isActive ? (
              <span className="text-[12px] text-fg-muted px-2">Active profile</span>
            ) : (
              <Button size="sm" onClick={() => send({ type: 'SET_ACTIVE_PROFILE', id: profile.id })}>Make active</Button>
            )}
            <DropdownMenu label="Profile actions" trigger={<IconButton icon={MoreHorizontal} label="Profile actions" size="sm" />} items={actions} />
          </>
        }
      >
        <input
          aria-label="Profile name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="-ml-1.5 px-1.5 h-9 w-full max-w-sm rounded-md bg-transparent text-xl font-semibold tracking-[-0.01em] outline-none hover:bg-surface-2 focus:bg-surface focus:ring-2 focus:ring-focus/40"
        />
      </PageHeader>

      {PROFILE_SECTIONS.map((section) => {
        const filled = section.fields.filter((f) => String(draft[f.name] ?? '').trim()).length
        return (
          <section key={section.title} className="mb-10">
            <div className="mb-2 flex items-end justify-between">
              <h2 className="text-[13px] font-semibold">{section.title}</h2>
              <span className="text-[12px] text-fg-subtle">{filled} of {section.fields.length}</span>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {section.fields.map((f) => (
                <ProfileField key={f.name} field={f} value={draft[f.name]} onChange={(k, v) => change({ [k]: v })} />
              ))}
            </div>
          </section>
        )
      })}

      <CustomFields items={draft.customFields || []} onChange={(customFields) => change({ customFields })} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${profile.name}”?`}
        description="This profile and any sites set to use it will be removed. This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          await send({ type: 'DELETE_PROFILE', id: profile.id })
          toast?.({ title: `Deleted ${profile.name}` })
          go('/profile')
        }}
      />
    </div>
  )
}
