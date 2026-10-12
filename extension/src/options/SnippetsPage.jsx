import React from 'react'
import { Button, Input, Textarea, Switch } from '../ui'
import { normalizeTrigger, validateSnippet, SNIPPET_MAX_LENGTH } from '../lib/snippets'
import { PageHeader, Group, SettingRow, EmptyRow, TextButton } from './layout'

const save = (snippets) => chrome.storage.local.set({ snippets })

function SnippetForm({ initial, others, onSave, onCancel }) {
  const [trigger, setTrigger] = React.useState(initial?.trigger || ';')
  const [text, setText] = React.useState(initial?.text || '')
  const [error, setError] = React.useState('')

  const submit = (e) => {
    e.preventDefault()
    const problem = validateSnippet({ trigger, text }, others)
    if (problem) return setError(problem)
    onSave({ trigger: normalizeTrigger(trigger), text })
  }

  return (
    <form onSubmit={submit} className="px-4 py-3 space-y-2">
      <div className="flex gap-3">
        <Input
          aria-label="Shortcut"
          value={trigger}
          onChange={(e) => { setTrigger(e.target.value); setError('') }}
          className="w-36 font-mono"
          autoFocus
        />
        <Textarea
          aria-label="Text to insert"
          placeholder="Text to insert. {date} and {time} are replaced when it's inserted."
          value={text}
          maxLength={SNIPPET_MAX_LENGTH}
          onChange={(e) => { setText(e.target.value); setError('') }}
          rows={3}
          className="flex-1"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-[12px] text-danger" role="alert">{error}</p>}
        <Button size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" variant="primary" type="submit">Save</Button>
      </div>
    </form>
  )
}

export default function SnippetsPage({ data }) {
  const { snippets, snippetsEnabled } = data
  const [editing, setEditing] = React.useState(null) // index, or 'new'

  const sorted = snippets.map((s, i) => ({ ...s, i })).sort((a, b) => a.trigger.localeCompare(b.trigger))
  const othersThan = (i) => snippets.filter((_, j) => j !== i)

  return (
    <div>
      <PageHeader
        title="Snippets"
        description="Type a shortcut in any text field and SmartFill replaces it with your saved text. Works in all text boxes except password and payment fields."
        actions={editing !== 'new' && <Button size="sm" onClick={() => setEditing('new')}>Add snippet</Button>}
      />

      <Group>
        <SettingRow label="Expand snippets as I type" htmlFor="set-snippets">
          <Switch id="set-snippets" checked={snippetsEnabled} onChange={(on) => chrome.storage.local.set({ snippetsEnabled: on })} />
        </SettingRow>
      </Group>

      <Group title="Your snippets">
        {editing === 'new' && (
          <SnippetForm
            others={snippets}
            onSave={(s) => { save([...snippets, s]); setEditing(null) }}
            onCancel={() => setEditing(null)}
          />
        )}
        {sorted.length === 0 && editing !== 'new' && (
          <EmptyRow>No snippets yet. Try ;addr for your address or ;intro for a short bio.</EmptyRow>
        )}
        {sorted.map((s) =>
          editing === s.i ? (
            <SnippetForm
              key={s.i}
              initial={s}
              others={othersThan(s.i)}
              onSave={(next) => { save(snippets.map((x, j) => (j === s.i ? next : x))); setEditing(null) }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div key={s.i} className="flex items-start gap-4 px-4 py-2.5 text-[13px]">
              <code className="w-28 shrink-0 font-mono text-fg">{s.trigger}</code>
              <p className="flex-1 min-w-0 text-fg-muted whitespace-pre-line line-clamp-2">{s.text}</p>
              <div className="flex gap-3 shrink-0">
                <TextButton onClick={() => setEditing(s.i)}>Edit</TextButton>
                <TextButton danger onClick={() => save(othersThan(s.i))}>Delete</TextButton>
              </div>
            </div>
          )
        )}
      </Group>
    </div>
  )
}
