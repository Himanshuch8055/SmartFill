import { describe, it, expect } from 'vitest'
import { matchAnswer, similarity, COMMON_QUESTIONS } from '../src/lib/answers.js'

const saved = COMMON_QUESTIONS

describe('screening answer matching', () => {
  it.each([
    ['Are you legally authorized to work in India?', 'Yes'],
    ['Are you authorised to work in the country where this job is located?', 'Yes'],
    ['Do you need visa sponsorship now or in the future?', 'No'],
    ['Will you require sponsorship for employment?', 'No'],
    ['Are you open to relocation?', 'Yes'],
    ['Are you willing to relocate to Pune?', 'Yes'],
    ['How did you hear about us?', 'LinkedIn'],
    ['Are you 18 years or older?', 'Yes'],
  ])('matches "%s"', (question, answer) => {
    expect(matchAnswer(question, saved)?.answer).toBe(answer)
  })

  it.each([
    'Are you willing to travel?',
    'What is your expected salary?',
    'Tell us about a project you are proud of',
    'Are you comfortable with on-call rotations?',
    'Desired start date',
  ])('does not match unrelated question "%s"', (question) => {
    expect(matchAnswer(question, saved)).toBeNull()
  })

  it('ignores empty saved answers', () => {
    expect(matchAnswer('Are you willing to relocate?', [{ question: 'Are you willing to relocate?', answer: '' }])).toBeNull()
  })

  it('prefers the closest saved question', () => {
    const list = [
      { question: 'Are you willing to relocate?', answer: 'Yes' },
      { question: 'Are you willing to relocate to London?', answer: 'No' },
    ]
    expect(matchAnswer('Willing to relocate to London?', list).answer).toBe('No')
    expect(similarity('', 'anything')).toBe(0)
  })
})
