// Optional AI answers: drafts a free-text answer ("Why do you want to work here?") with the user's
// own Anthropic API key. Called only when the user asks for a draft; nothing is sent otherwise.
import { t, mark } from './i18n'

export const AI_ORIGIN = 'https://api.anthropic.com/*'
const API_URL = 'https://api.anthropic.com/v1/messages'

export const AI_MODELS = [
  { id: 'claude-haiku-5-5', label: mark('Claude Haiku 5.5 (fast, low cost)') },
  { id: 'claude-sonnet-5-5', label: mark('Claude Sonnet 5.5 (best writing)') },
]
export const DEFAULT_MODEL = AI_MODELS[0].id

// Profile fields that help write an answer. Contact details, dates of birth, salary and the like
// are never sent: an answer doesn't need them.
const USEFUL_FIELDS = {
  fullName: 'Name',
  jobTitle: 'Current job title',
  company: 'Current company',
  yearsExperience: 'Years of experience',
  city: 'City',
  country: 'Country',
  school: 'School / University',
  degree: 'Degree',
  fieldOfStudy: 'Field of study',
  graduationYear: 'Graduation year',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
  website: 'Website',
  bio: 'About me',
}

export const PAGE_TEXT_LIMIT = 6000

export function profileSummary(profile = {}) {
  const lines = []
  for (const [key, label] of Object.entries(USEFUL_FIELDS)) {
    const v = String(profile[key] ?? '').trim()
    if (v) lines.push(`${label}: ${v}`)
  }
  for (const { question, answer } of profile.answers || []) {
    if (question?.trim() && String(answer ?? '').trim()) lines.push(`Q: ${question.trim()} A: ${String(answer).trim()}`)
  }
  return lines.join('\n')
}

const SYSTEM = [
  'You write answers for the person filling in a form (usually a job application), in their voice: first person, natural, specific and concise.',
  'Use only facts from the profile and the page. Never invent employers, projects, numbers, dates or skills.',
  'Where a fact the answer needs is missing, write a short placeholder in square brackets, like [a project you are proud of], so the person can fill it in.',
  'Reply with the answer text only: no preamble, no quotes, no markdown.',
].join(' ')

export function buildPrompt({ question, pageTitle = '', pageText = '', profile = {}, maxLength = 0 }) {
  const limit = maxLength > 0 ? `Keep it under ${maxLength} characters.` : 'Aim for 80 to 180 words unless the question asks for less.'
  return [
    `Question on the form:\n${String(question).trim()}`,
    pageTitle && `Page title: ${pageTitle}`,
    pageText && `Text from the page (for context, may be cut off):\n${String(pageText).slice(0, PAGE_TEXT_LIMIT)}`,
    `About the person:\n${profileSummary(profile) || '(no details saved)'}`,
    limit,
  ]
    .filter(Boolean)
    .join('\n\n')
}

// Returns { ok: true, text } or { ok: false, code, error }.
export async function draftAnswer({ apiKey, model = DEFAULT_MODEL, ...input }, fetchImpl = fetch) {
  if (!apiKey) return { ok: false, code: 'no-key', error: t('Add your Anthropic API key in Settings → AI answers.') }
  let res
  try {
    res = await fetchImpl(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Requests come from the extension, not a server; the API requires opting in to that.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 700, system: SYSTEM, messages: [{ role: 'user', content: buildPrompt(input) }] }),
    })
  } catch {
    return { ok: false, code: 'network', error: t("Couldn't reach the AI service. Check your connection.") }
  }
  if (!res.ok) {
    const code = res.status === 401 || res.status === 403 ? 'auth' : res.status === 429 ? 'rate' : res.status >= 500 ? 'server' : 'request'
    const error = {
      auth: t('Your API key was not accepted. Check it in Settings → AI answers.'),
      rate: t('The AI service is busy or your usage limit was reached. Try again in a minute.'),
      server: t('The AI service had a problem. Try again in a minute.'),
      request: t("The AI service couldn't handle this request."),
    }[code]
    return { ok: false, code, error }
  }
  const data = await res.json().catch(() => null)
  let text = (data?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim()
  if (!text) return { ok: false, code: 'empty', error: t('The AI returned an empty answer. Try again.') }
  if (input.maxLength > 0 && text.length > input.maxLength) text = text.slice(0, input.maxLength).replace(/\s+\S*$/, '')
  return { ok: true, text }
}
