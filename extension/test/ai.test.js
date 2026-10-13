import { describe, it, expect } from 'vitest'
import { buildPrompt, profileSummary, draftAnswer } from '../src/lib/ai.js'

const PROFILE = {
  fullName: 'Asha Verma', jobTitle: 'Frontend Engineer', company: 'Acme', bio: 'I build accessible web apps.',
  email: 'asha@example.com', phone: '+91 90000 11111', dob: '1995-02-03', address1: '12 MG Road', currentCtc: '30 LPA',
  answers: [{ question: 'Are you willing to relocate?', answer: 'Yes' }],
}

describe('AI answers', () => {
  it('sends only the profile details an answer needs', () => {
    const summary = profileSummary(PROFILE)
    expect(summary).toContain('Asha Verma')
    expect(summary).toContain('Frontend Engineer')
    expect(summary).toContain('Are you willing to relocate? A: Yes')
    for (const secret of ['asha@example.com', '90000', '1995', 'MG Road', '30 LPA']) expect(summary).not.toContain(secret)
  })

  it('builds the prompt with the question, page text and length limit', () => {
    const prompt = buildPrompt({ question: 'Why Acme?', pageTitle: 'Acme · Apply', pageText: 'x'.repeat(10000), profile: PROFILE, maxLength: 500 })
    expect(prompt).toContain('Why Acme?')
    expect(prompt).toContain('Keep it under 500 characters.')
    expect(prompt.length).toBeLessThan(6000 + 1500)
  })

  it('calls the API with the key and returns the text, trimmed to maxlength', async () => {
    let request
    const fakeFetch = async (url, init) => {
      request = { url, init: { ...init, body: JSON.parse(init.body) } }
      return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'I love building accessible products for many people. ' + 'More words '.repeat(20) }] }) }
    }
    const res = await draftAnswer({ apiKey: 'sk-ant-test', model: 'claude-haiku-5-5', question: 'Why Acme?', profile: PROFILE, maxLength: 60 }, fakeFetch)
    expect(request.url).toBe('https://api.anthropic.com/v1/messages')
    expect(request.init.headers['x-api-key']).toBe('sk-ant-test')
    expect(request.init.body.model).toBe('claude-haiku-5-5')
    expect(res.ok).toBe(true)
    expect(res.text.length).toBeLessThanOrEqual(60)
    expect(res.text.endsWith(' ')).toBe(false)
  })

  it('explains errors', async () => {
    expect((await draftAnswer({ apiKey: '' })).code).toBe('no-key')
    const status = (s) => async () => ({ ok: false, status: s, json: async () => ({}) })
    expect((await draftAnswer({ apiKey: 'k', question: 'q' }, status(401))).code).toBe('auth')
    expect((await draftAnswer({ apiKey: 'k', question: 'q' }, status(429))).code).toBe('rate')
    expect((await draftAnswer({ apiKey: 'k', question: 'q' }, async () => { throw new Error('offline') })).code).toBe('network')
  })
})
