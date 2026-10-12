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
