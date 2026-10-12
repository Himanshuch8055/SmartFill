// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { normalizeTrigger, validateSnippet, matchSnippet, findExpansion, expandAtCaret, renderSnippet, canExpandIn } from '../src/lib/snippets.js'

const SNIPPETS = [
  { trigger: ';addr', text: '221B Baker Street' },
  { trigger: ';intro', text: 'Hi there' },
  { trigger: ';intro2', text: 'Hello again' },
]
const mount = (html) => (document.body.innerHTML = html)
beforeEach(() => mount(''))

// Simulates typing: append text at the caret, then run expansion for the last character.
function type(el, chars) {
  for (const ch of chars) {
    const pos = el.selectionStart
    el.value = el.value.slice(0, pos) + ch + el.value.slice(pos)
    el.setSelectionRange(pos + 1, pos + 1)
    expandAtCaret(el, SNIPPETS, ch)
  }
}

describe('snippet triggers', () => {
  it('normalizes and validates', () => {
    expect(normalizeTrigger(' ;Addr! ')).toBe(';addr')
    expect(normalizeTrigger('home')).toBe(';home')
    expect(normalizeTrigger(';')).toBe('')
    expect(validateSnippet({ trigger: ';', text: 'x' })).toMatch(/shortcut/)
    expect(validateSnippet({ trigger: ';a', text: '  ' })).toMatch(/text/)
    expect(validateSnippet({ trigger: 'ADDR', text: 'x' }, SNIPPETS)).toMatch(/already used/)
    expect(validateSnippet({ trigger: ';new', text: 'x' }, SNIPPETS)).toBe('')
  })

  it('matches only a whole word at the caret', () => {
    expect(matchSnippet('my ;addr', SNIPPETS)?.text).toBe('221B Baker Street')
    expect(matchSnippet(';ADDR', SNIPPETS)?.trigger).toBe(';addr')
    expect(matchSnippet('x;addr', SNIPPETS)).toBeNull()
    expect(matchSnippet(';add', SNIPPETS)).toBeNull()
    expect(matchSnippet(';x', [{ trigger: ';x' }])).toBeNull() // broken data
  })

  it('waits for a space when a longer trigger shares the prefix', () => {
    expect(findExpansion(';intro', 'o', SNIPPETS)).toBeNull()
    expect(findExpansion(';intro ', ' ', SNIPPETS)).toMatchObject({ keep: 1, hit: { trigger: ';intro' } })
    expect(findExpansion(';intro2', '2', SNIPPETS)).toMatchObject({ keep: 0, hit: { text: 'Hello again' } })
    expect(findExpansion(';addr ', ' ', SNIPPETS)).toBeNull() // already expanded on "r"
  })

  it('renders date placeholders', () => {
    expect(renderSnippet('by {date}', new Date(2026, 0, 2))).toBe('by ' + new Date(2026, 0, 2).toLocaleDateString())
  })
})

describe('expanding in fields', () => {
  it('expands as you type in an input, keeping surrounding text', () => {
    mount('<input id="i" value="">')
    const el = document.getElementById('i')
    el.setSelectionRange(0, 0)
    type(el, 'Ship to ;addr')
    expect(el.value).toBe('Ship to 221B Baker Street')
    expect(el.selectionStart).toBe(el.value.length)
  })

  it('expands an ambiguous trigger on space and keeps the space', () => {
    mount('<textarea id="t"></textarea>')
    const el = document.getElementById('t')
    type(el, ';intro ok')
    expect(el.value).toBe('Hi there ok')
    el.value = ''
    el.setSelectionRange(0, 0)
    type(el, ';intro2')
    expect(el.value).toBe('Hello again')
  })

  it('never expands in passwords, card fields or read-only fields', () => {
    mount(`<input id="p" type="password"><input id="c" autocomplete="cc-number"><input id="r" readonly><input id="n" type="number">`)
    for (const id of ['p', 'c', 'r', 'n']) expect(canExpandIn(document.getElementById(id))).toBe(false)
  })

  it('respects maxlength', () => {
    mount('<input id="m" maxlength="8">')
    const el = document.getElementById('m')
    el.setSelectionRange(0, 0)
    type(el, ';addr')
    expect(el.value).toBe(';addr')
  })
})

describe('word-at-a-time input', () => {
  it('uses the last inserted character', () => {
    expect(findExpansion('note ;addr', 'note ;addr', SNIPPETS)?.hit.trigger).toBe(';addr')
    expect(findExpansion(';intro ', ';intro ', SNIPPETS)?.keep).toBe(1)
    expect(findExpansion('', '', SNIPPETS)).toBeNull()
  })
})
