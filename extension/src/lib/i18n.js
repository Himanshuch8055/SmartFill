// Translations. Strings are written in English in the code and wrapped in t(); the English text is
// the key, so anything not yet translated simply shows in English.
//   t('Filled {n} fields', { n: 3 })
//   tn(n, '{n} field', '{n} fields')   one/other plural forms
import hi from '../locales/hi'

export const LANGUAGES = [
  { id: 'auto', label: 'Same as browser' },
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी (Hindi)' },
]
const DICTIONARIES = { hi }

let dict = null
let lang = 'en'

export function resolveLanguage(pref, browserLang = globalThis.navigator?.language || 'en') {
  const id = pref && pref !== 'auto' ? pref : String(browserLang).toLowerCase().split('-')[0]
  return DICTIONARIES[id] || id === 'en' ? id : 'en'
}

export function setLanguage(pref) {
  lang = resolveLanguage(pref)
  dict = DICTIONARIES[lang] || null
  try { document.documentElement.lang = lang } catch {}
  return lang
}

export const getLanguage = () => lang

// Reads the saved preference. Call once before rendering a page.
export async function initLanguage() {
  try {
    const { language } = await chrome.storage.local.get(['language'])
    return setLanguage(language)
  } catch {
    return setLanguage('auto')
  }
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s)

export function t(text, vars) {
  return fill((dict && dict[text]) || text, vars)
}

export function tn(n, one, other, vars) {
  return t(n === 1 ? one : other, { n, ...vars })
}

setLanguage('auto')

// Marks a string for translation without translating it yet: for module-level constants that are
// created before the language is known. Translate at render time with t(value).
export const mark = (text) => text
