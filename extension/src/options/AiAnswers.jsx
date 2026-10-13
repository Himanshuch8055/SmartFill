// Settings → AI answers: opt-in drafting of free-text answers with the user's own Anthropic API key.
import React from 'react'
import { Button, Input, Select, Switch } from '../ui'
import { t } from '../lib/i18n'
import { AI_MODELS, AI_ORIGIN, DEFAULT_MODEL } from '../lib/ai'
import { send } from './data'
import { Group, SettingRow, TextButton } from './layout'

const KEYS_URL = 'https://console.anthropic.com/settings/keys'

export default function AiAnswers({ toast }) {
  const [state, setState] = React.useState(null)
  const [key, setKey] = React.useState('')
  const [status, setStatus] = React.useState(null) // { tone, text }
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => setState(await send({ type: 'GET_AI_STATE' })), [])
  React.useEffect(() => { load() }, [load])
  if (!state || state.locked) return null

  const toggle = async (on) => {
    if (on) {
      // Asked only now, so SmartFill never has access to the AI service unless the user wants it.
      const granted = await chrome.permissions.request({ origins: [AI_ORIGIN] }).catch(() => false)
      if (!granted) return setStatus({ tone: 'danger', text: t('SmartFill needs permission to contact the AI service.') })
      await chrome.storage.local.set({ aiEnabled: true })
    } else {
      await chrome.storage.local.set({ aiEnabled: false })
      await chrome.permissions.remove({ origins: [AI_ORIGIN] }).catch(() => {})
    }
    setStatus(null)
    load()
  }

  const saveKey = async (e) => {
    e.preventDefault()
    const clean = key.trim()
    if (!clean) return
    setBusy(true)
    setStatus(null)
    try {
      const res = await send({ type: 'TEST_AI_KEY', key: clean })
      if (!res?.ok && res?.code === 'auth') return setStatus({ tone: 'danger', text: res.error })
      await send({ type: 'SET_AI_KEY', key: clean })
      setKey('')
      setStatus(res?.ok ? { tone: 'success', text: t('Key saved and working.') } : { tone: 'muted', text: t('Key saved. Testing it failed: {error}', { error: res?.error || '' }) })
      load()
    } finally {
      setBusy(false)
    }
  }

  const removeKey = async () => {
    await send({ type: 'SET_AI_KEY', key: '' })
    toast?.({ title: t('API key removed') })
    load()
  }

  const tone = { danger: 'text-danger', success: 'text-success', muted: 'text-fg-muted' }

  return (
    <Group
      title={t('AI answers')}
      description={t('Draft answers to open questions like "Why do you want to work here?" with your own Anthropic API key. Right-click a text box and choose "Draft an answer with AI". The draft goes into the field for you to edit.')}
    >
      <SettingRow label={t('Draft answers with AI')} htmlFor="set-ai">
        <Switch id="set-ai" checked={state.enabled} onChange={toggle} />
      </SettingRow>
      {state.enabled && (
        <>
          <div className="px-4 py-3">
            <p className="text-[13px] font-medium">{t('Anthropic API key')}</p>
            {state.hasKey ? (
              <div className="mt-1.5 flex items-center gap-3 text-[13px]">
                <span className="text-fg-muted">{t('A key is saved in this browser.')}</span>
                <TextButton danger onClick={removeKey}>{t('Remove key')}</TextButton>
              </div>
            ) : (
              <form onSubmit={saveKey} className="mt-1.5 flex gap-2">
                <Input
                  type="password"
                  autoComplete="off"
                  aria-label={t('Anthropic API key')}
                  placeholder="sk-ant-…"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" loading={busy} disabled={!key.trim()}>{t('Save and test')}</Button>
              </form>
            )}
            {status && <p className={`mt-2 text-[12px] ${tone[status.tone]}`} role="status">{status.text}</p>}
            <p className="mt-2 text-[12px] text-fg-muted">
              {t('Get a key from the Anthropic Console. You pay Anthropic for what you use; a draft usually costs well under a cent.')}{' '}
              <a className="text-accent-text hover:underline" href={KEYS_URL} target="_blank" rel="noreferrer">{t('Get an API key')}</a>
            </p>
          </div>
          <SettingRow label={t('Model')} htmlFor="set-ai-model">
            <Select id="set-ai-model" value={state.model || DEFAULT_MODEL} onChange={async (e) => { await chrome.storage.local.set({ aiModel: e.target.value }); load() }} className="w-72">
              {AI_MODELS.map((m) => <option key={m.id} value={m.id}>{t(m.label)}</option>)}
            </Select>
          </SettingRow>
          <p className="px-4 py-3 text-[12px] text-fg-muted">
            {t('Sent to Anthropic only when you ask for a draft: the question, text from the page (up to about 6,000 characters), and your name, job, education, links, bio and saved answers. Your email, phone, address, date of birth and salary are never sent. The key is encrypted with your profiles when the PIN lock is on.')}
          </p>
        </>
      )}
    </Group>
  )
}
