import React from 'react'
import { FileText, Plus, X } from 'lucide-react'
import { Button, IconButton, Input } from '../ui'
import { COMMON_QUESTIONS } from '../lib/answers'
import { send } from './data'
import { TextButton } from './layout'

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Resume stored for this profile and attached to "Resume / CV" upload fields.
function ResumeCard({ profileId, meta, onChange }) {
  const fileRef = React.useRef(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    if (!/\.(pdf|docx?)$/i.test(file.name)) return setError('Choose a PDF or Word file.')
    if (file.size > MAX_BYTES) return setError(`${file.name} is ${formatSize(file.size)}. The limit is 2 MB.`)
    setBusy(true)
    try {
      const resume = { name: file.name, type: file.type, size: file.size, dataUrl: await readAsDataUrl(file) }
      const res = await send({ type: 'SET_RESUME', id: profileId, resume })
      if (!res?.ok) throw new Error(res?.error)
      onChange({ name: resume.name, type: resume.type, size: resume.size })
    } catch (err) {
      setError(err?.message || "Couldn't save the file.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    await send({ type: 'SET_RESUME', id: profileId, resume: null })
    onChange(null)
    setBusy(false)
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-surface-2 grid place-items-center text-fg-muted">
          <FileText size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {meta ? (
            <>
              <p className="text-[13px] font-medium truncate" title={meta.name}>{meta.name}</p>
              <p className="text-[12px] text-fg-muted">{formatSize(meta.size)} · attached to resume upload fields</p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium">Resume / CV</p>
              <p className="text-[12px] text-fg-muted">PDF or Word, up to 2 MB. Stored only in this browser.</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {meta && <TextButton onClick={remove} disabled={busy}>Remove</TextButton>}
          <Button size="sm" loading={busy} onClick={() => fileRef.current?.click()}>{meta ? 'Replace' : 'Upload'}</Button>
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" aria-label="Resume file" onChange={pick} />
      </div>
      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
    </div>
  )
}

// Saved answers to common screening questions, matched to forms by wording.
function ScreeningAnswers({ items, onChange }) {
  const update = (i, key, val) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: val } : it)))
  const remove = (i) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, { question: '', answer: '' }])
  const existing = new Set(items.map((it) => it.question.trim().toLowerCase()))
  const missing = COMMON_QUESTIONS.filter((q) => !existing.has(q.question.toLowerCase()))

  return (
    <div className="border-t border-line">
      <div className="px-4 pt-4">
        <p className="text-[13px] font-medium">Screening questions</p>
        <p className="text-[12px] text-fg-muted mt-0.5">
          Answers for questions application forms ask. SmartFill matches them by wording, including yes/no dropdowns and options.
        </p>
      </div>
      {items.length > 0 && (
        <div className="px-4 pt-3 space-y-2.5">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_160px_auto] gap-2 items-center">
              <Input aria-label="Question" placeholder="Question, e.g. Are you willing to relocate?" value={it.question} onChange={(e) => update(i, 'question', e.target.value)} />
              <Input aria-label="Answer" placeholder="Answer" value={it.answer} onChange={(e) => update(i, 'answer', e.target.value)} />
              <IconButton icon={X} label="Remove question" size="sm" onClick={() => remove(i)} />
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-3 flex flex-wrap gap-x-5 gap-y-2">
        <TextButton onClick={add} className="inline-flex items-center gap-1.5 text-accent-text hover:text-accent-text">
          <Plus size={14} aria-hidden /> Add question
        </TextButton>
        {missing.length > 0 && (
          <TextButton onClick={() => onChange([...items, ...missing.map((q) => ({ ...q }))])}>
            Add {missing.length} common question{missing.length === 1 ? '' : 's'}
          </TextButton>
        )}
      </div>
    </div>
  )
}

export default function JobApplication({ profileId, draft, change, setResumeMeta }) {
  return (
    <section className="mb-10">
      <div className="mb-2">
        <h2 className="text-[13px] font-semibold">Job applications</h2>
        <p className="text-[12px] text-fg-muted mt-0.5">Your resume and answers to common screening questions.</p>
      </div>
      <div className="rounded-lg border border-line bg-surface">
        <ResumeCard profileId={profileId} meta={draft.resume} onChange={setResumeMeta} />
        <ScreeningAnswers items={draft.answers || []} onChange={(answers) => change({ answers })} />
      </div>
    </section>
  )
}
