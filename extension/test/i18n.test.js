import { describe, it, expect } from 'vitest'
import { extractStrings } from '../scripts/i18n-strings.mjs'
import { t, tn, setLanguage, resolveLanguage } from '../src/lib/i18n.js'
import hi from '../src/locales/hi.js'

const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join()

describe('translations', () => {
  const strings = extractStrings()

  it('finds the UI strings', () => {
    expect(strings.length).toBeGreaterThan(200)
  })

  it('has a Hindi translation for every string', () => {
    expect(strings.filter((s) => !(s in hi))).toEqual([])
  })

  it('keeps the same {placeholders} and has no stale entries', () => {
    expect(Object.keys(hi).filter((k) => placeholders(k) !== placeholders(hi[k]))).toEqual([])
    expect(Object.keys(hi).filter((k) => !strings.includes(k))).toEqual([])
  })
})

describe('t()', () => {
  it('fills placeholders, falls back to English and picks the language', () => {
    setLanguage('en')
    expect(t('Filled {n} fields', { n: 3 })).toBe('Filled 3 fields')
    expect(tn(1, '{n} field', '{n} fields')).toBe('1 field')
    expect(t('Not a real key')).toBe('Not a real key')
    expect(resolveLanguage('auto', 'hi-IN')).toBe('hi')
    expect(resolveLanguage('auto', 'fr-FR')).toBe('en')
    expect(resolveLanguage('hi')).toBe('hi')
    setLanguage('hi')
    expect(t('Not a real key')).toBe('Not a real key')
    setLanguage('en')
  })
})
