// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { findAnswerTargets, findResumeInputs, findFillableInputs, fillElement, snapshot, restore } from '../src/lib/detectFields.js'
import { COMMON_QUESTIONS } from '../src/lib/answers.js'

const mount = (html) => (document.body.innerHTML = html)
beforeEach(() => mount(''))

describe('screening answer targets', () => {
  it('finds dropdown, radio and text questions and fills them', () => {
    mount(`
      <label for="auth">Are you legally authorized to work in India?</label>
      <select id="auth"><option value="">Select…</option><option value="1">Yes</option><option value="0">No</option></select>
      <fieldset><legend>Will you now or in the future require sponsorship?</legend>
        <label><input type="radio" name="spons" value="yes">Yes</label>
        <label><input type="radio" name="spons" value="no">No</label>
      </fieldset>
      <label for="src">How did you hear about us?</label><input id="src">
      <label for="travel">Are you willing to travel?</label><input id="travel">`)
    const targets = findAnswerTargets(document, COMMON_QUESTIONS)
    expect(targets.map((t) => t.answer)).toEqual(['Yes', 'No', 'LinkedIn'])
    for (const t of targets) fillElement('__answer', t.target, t.answer)
    expect(document.getElementById('auth').value).toBe('1')
    expect(document.querySelector('[value=no]').checked).toBe(true)
    expect(document.getElementById('src').value).toBe('LinkedIn')
    expect(document.getElementById('travel').value).toBe('') // unrelated question left alone
  })

  it('skips fields already claimed by profile fields', () => {
    mount(`<label for="e">How did you hear about us?</label><input id="e">`)
    const claimed = new Set([document.getElementById('e')])
    expect(findAnswerTargets(document, COMMON_QUESTIONS, claimed)).toEqual([])
  })

  it('does nothing without saved answers', () => {
    mount(`<label for="a">Are you willing to relocate?</label><input id="a">`)
    expect(findAnswerTargets(document, [])).toEqual([])
  })
})

describe('resume inputs', () => {
  it('finds resume/CV upload fields, including hidden ones', () => {
    mount(`
      <label for="r1">Resume/CV</label><input type="file" id="r1">
      <div class="resume-upload"><input type="file" id="r2" style="display:none" accept=".pdf"></div>
      <label for="c">Cover letter</label><input type="file" id="c">
      <label for="p">Profile photo</label><input type="file" id="p" accept="image/*">
      <label for="cv-img">CV</label><input type="file" id="cv-img" accept="image/png">`)
    expect(findResumeInputs(document).map((el) => el.id)).toEqual(['r1', 'r2'])
  })

  it('never treats a resume upload as a normal profile field', () => {
    mount(`<label for="r">Resume</label><input type="file" id="r" name="resume">`)
    expect(findFillableInputs(document)).toEqual({})
  })

  it('undo clears an attached file input', () => {
    mount(`<input type="file" id="r">`)
    const el = document.getElementById('r')
    const snap = snapshot({ __resume: [el] })
    // Simulate a file having been attached
    Object.defineProperty(el, 'value', { configurable: true, get: () => 'C:\\fakepath\\cv.pdf', set: (v) => { Object.defineProperty(el, 'value', { configurable: true, value: v, writable: true }) } })
    restore(snap)
    expect(el.value).toBe('')
  })
})

describe('multi-page forms: empty targets', () => {
  it('only treats untouched fields as empty', async () => {
    const { isEmptyTarget } = await import('../src/lib/detectFields.js')
    mount(`
      <input id="a"><input id="b" value="typed">
      <select id="s"><option value="">Choose</option><option value="x">X</option></select>
      <select id="s2"><option value="x" selected>X</option></select>
      <input type="checkbox" id="c">
      <label><input type="radio" name="r" value="1">1</label><label><input type="radio" name="r" value="2" checked>2</label>
      <label><input type="radio" name="q" value="1">1</label>
      <textarea id="t">  </textarea>`)
    const $ = (id) => document.getElementById(id)
    expect(isEmptyTarget($('a'))).toBe(true)
    expect(isEmptyTarget($('b'))).toBe(false)
    expect(isEmptyTarget($('s'))).toBe(true)
    expect(isEmptyTarget($('s2'))).toBe(false)
    expect(isEmptyTarget($('c'))).toBe(false) // unchecked is a valid answer
    expect(isEmptyTarget([...document.querySelectorAll('[name=r]')])).toBe(false)
    expect(isEmptyTarget([...document.querySelectorAll('[name=q]')])).toBe(true)
    expect(isEmptyTarget($('t'))).toBe(true)
  })
})

describe('custom dropdowns (role="combobox")', () => {
  // A small stand-in for React Select: options render after typing; clicking one shows it as the value.
  function mountCombobox(id, options) {
    const wrap = document.createElement('div')
    wrap.innerHTML = `<label for="${id}">Country</label><div><div><span id="${id}-placeholder">Select...</span>
      <input id="${id}" role="combobox" aria-controls="${id}-list" aria-describedby="${id}-placeholder"></div></div>
      <div id="${id}-list" role="listbox"></div>`
    document.body.appendChild(wrap)
    const input = wrap.querySelector('input')
    const list = wrap.querySelector('[role=listbox]')
    const shown = wrap.querySelector('span')
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase()
      list.innerHTML = q ? options.filter((o) => o.toLowerCase().includes(q)).map((o) => `<div role="option">${o}</div>`).join('') : ''
    })
    // Like React Select: typed text that wasn't chosen is dropped when the field loses focus.
    input.addEventListener('blur', () => { input.value = ''; list.innerHTML = '' })
    list.addEventListener('click', (e) => {
      shown.textContent = e.target.textContent
      shown.id = ''
      input.value = ''
      list.innerHTML = ''
    })
    return { input, shown }
  }

  it('types, waits for the options and clicks the best match', async () => {
    const { fillCombobox, isEmptyTarget } = await import('../src/lib/detectFields.js')
    const { input, shown } = mountCombobox('c', ['British Indian Ocean Territory', 'India', 'Indonesia'])
    expect(isEmptyTarget(input)).toBe(true)
    expect(await fillCombobox(input, 'India')).toBe(true)
    expect(shown.textContent).toBe('India')
    expect(isEmptyTarget(input)).toBe(false) // a chosen option counts as filled on later steps
  })

  it('fills dropdowns after normal fields and counts them', async () => {
    const { fillFields, settleComboboxes, findFillableInputs } = await import('../src/lib/detectFields.js')
    mount('<label for="e">Email</label><input id="e" type="email">')
    const { shown } = mountCombobox('k', ['Canada', 'India'])
    const { filled, pending } = fillFields(findFillableInputs(document), { email: 'a@example.com', country: 'IN' })
    expect([filled, pending]).toEqual([1, 1])
    expect(await settleComboboxes()).toBe(1)
    expect(shown.textContent).toBe('India') // matched via the IN alias
  })

  it('leaves a dropdown empty when nothing matches', async () => {
    const { fillCombobox } = await import('../src/lib/detectFields.js')
    const { input, shown } = mountCombobox('n', ['Canada'])
    expect(await fillCombobox(input, 'Narnia', { timeout: 300 })).toBe(false)
    expect(shown.textContent).toBe('Select...')
  })
})

describe('questions shown above the field (Lever custom questions)', () => {
  it('reads the question block next to radios and dropdowns', async () => {
    const fs = await import('fs')
    const path = await import('path')
    mount(fs.readFileSync(path.join(__dirname, 'fixtures', 'lever-2026.html'), 'utf8'))
    const targets = findAnswerTargets(document, COMMON_QUESTIONS)
    const byAnswer = Object.fromEntries(targets.map((t) => [t.question.slice(0, 30), t.answer]))
    expect(byAnswer).toMatchObject({
      'are you legally authorized to ': 'Yes',
      'please tell us how you heard a': 'LinkedIn',
    })
    // The language checkboxes and the free-text "why" question are left alone.
    expect(targets.some((t) => /language|why do you/.test(t.question))).toBe(false)
  })
})

describe('custom dropdowns without a linked list', () => {
  it('never clicks options from a menu that was already on the page, or links', async () => {
    const { fillCombobox } = await import('../src/lib/detectFields.js')
    mount(`
      <div role="listbox"><a href="#danger" role="option" id="old">India</a></div>
      <label for="c">Country</label><input id="c" role="combobox">`)
    // jsdom has no layout: report every element as visible.
    const rects = Element.prototype.getClientRects
    Element.prototype.getClientRects = () => [{}]
    let clicked = false
    document.getElementById('old').addEventListener('click', (e) => { clicked = true; e.preventDefault() })
    try {
      await fillCombobox(document.getElementById('c'), 'India', { timeout: 300 })
    } finally {
      Element.prototype.getClientRects = rects
    }
    expect(clicked).toBe(false)
  })
})
