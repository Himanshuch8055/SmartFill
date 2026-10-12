import React from 'react'
import { MoreHorizontal, Plus, X } from 'lucide-react'
import { Button, IconButton, Field, Input, Select, Textarea, DropdownMenu, ConfirmDialog, cn } from '../ui'
import { PROFILE_SECTIONS } from '../lib/profileFields'
import { send, go } from './data'
import { PageHeader, TextButton } from './layout'
import JobApplication from './JobApplication'
import { t } from '../lib/i18n'

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
        {t("Couldn't save.")} <TextButton className="text-danger" onClick={onRetry}>{t('Retry')}</TextButton>
      </span>
    )
  }
  return (
    <span className="text-[12px] text-fg-subtle" aria-live="polite">
      {status === 'saved' ? t('All changes saved') : t('Saving…')}
    </span>
  )
}

function ProfileField({ field, value, onChange }) {
  const common = { value: value ?? '', onChange: (e) => onChange(field.name, e.target.value) }
  let control
  if (field.type === 'select') {
    control = (
      <Select {...common}>
        <option value="">{t('Not set')}</option>
        {field.options.map((o) => <option key={o} value={o}>{t(o)}</option>)}
      </Select>
    )
  } else if (field.type === 'textarea') {
    control = <Textarea rows={3} placeholder={field.placeholder ? t(field.placeholder) : undefined} {...common} />
  } else {
    control = <Input type={field.type || 'text'} placeholder={field.placeholder ? t(field.placeholder) : undefined} autoComplete="off" {...common} />
  }
  return (
    <Field label={t(field.label)} className={field.full ? 'md:col-span-2' : ''}>
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
        <h2 className="text-[13px] font-semibold">{t('Custom fields')}</h2>
        <p className="text-[12px] text-fg-muted mt-0.5">
          {t('For anything not listed above. SmartFill fills a field when its label matches the name.')}
        </p>
      </div>
      <div className="rounded-lg border border-line bg-surface">
        {items.length > 0 && (
          <div className="p-4 space-y-2.5">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input aria-label={t('Field name')} placeholder={t('Label on the form, e.g. Nationality')} value={it.name || ''} onChange={(e) => update(i, 'name', e.target.value)} />
                <Input aria-label={t('Value')} placeholder={t('Value')} value={it.value || ''} onChange={(e) => update(i, 'value', e.target.value)} />
                <IconButton icon={X} label={t('Remove field')} size="sm" onClick={() => remove(i)} />
              </div>
            ))}
          </div>
        )}
        <div className={cn('px-4 py-3', items.length > 0 && 'border-t border-line')}>
          <TextButton onClick={add} className="inline-flex items-center gap-1.5 text-accent-text hover:text-accent-text">
            <Plus size={14} aria-hidden /> {t('Add custom field')}
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
    const next = name.trim() || t('Profile')
    setName(next)
    if (next !== profile.name) await send({ type: 'RENAME_PROFILE', id: profile.id, name: next })
  }

  const isActive = profile.id === data.activeId
  const onlyProfile = data.profiles.length < 2

  const actions = [
    { label: t('Duplicate'), onSelect: async () => {
      const res = await send({ type: 'DUPLICATE_PROFILE', id: profile.id })
      if (res?.id) go(`/profile/${res.id}`)
    } },
    ...(onlyProfile ? [] : ['separator', { label: t('Delete profile…'), danger: true, onSelect: () => setConfirmDelete(true) }]),
  ]

  return (
    <div>
      <PageHeader
        actions={
          <>
            <SaveStatus status={status} onRetry={retry} />
            {isActive ? (
              <span className="text-[12px] text-fg-muted px-2">{t('Active profile')}</span>
            ) : (
              <Button size="sm" onClick={() => send({ type: 'SET_ACTIVE_PROFILE', id: profile.id })}>{t('Make active')}</Button>
            )}
            <DropdownMenu label={t('Profile actions')} trigger={<IconButton icon={MoreHorizontal} label={t('Profile actions')} size="sm" />} items={actions} />
          </>
        }
      >
        <input
          aria-label={t('Profile name')}
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
              <h2 className="text-[13px] font-semibold">{t(section.title)}</h2>
              <span className="text-[12px] text-fg-subtle">{t('{filled} of {total}', { filled, total: section.fields.length })}</span>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {section.fields.map((f) => (
                <ProfileField key={f.name} field={f} value={draft[f.name]} onChange={(k, v) => change({ [k]: v })} />
              ))}
            </div>
          </section>
        )
      })}

      <JobApplication
        profileId={profile.id}
        draft={draft}
        change={change}
        // The resume is saved separately (SET_RESUME); keep the draft in sync without autosaving it.
        setResumeMeta={(resume) => {
          draftRef.current = { ...draftRef.current, resume }
          setDraft(draftRef.current)
        }}
      />

      <CustomFields items={draft.customFields || []} onChange={(customFields) => change({ customFields })} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('Delete “{name}”?', { name: profile.name })}
        description={t("This profile and any sites set to use it will be removed. This can't be undone.")}
        confirmLabel={t('Delete')}
        danger
        onConfirm={async () => {
          await send({ type: 'DELETE_PROFILE', id: profile.id })
          toast?.({ title: t('Deleted {name}', { name: profile.name }) })
          go('/profile')
        }}
      />
    </div>
  )
}
