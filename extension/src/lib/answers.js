// Screening answers: match saved { question, answer } pairs to questions on a form by wording.

// Words that carry no meaning for matching ("are you", "the", "this"…).
const STOP = new Set(
  'a an and any are as at be been being by can could currently do does for from have how i if in into is it legally of on or our please the their there this to us was we were what when which who will with would you your yes no now future'.split(' ')
)

// A few words that mean the same thing in screening questions.
const SYNONYMS = {
  authorised: 'authorized',
  authorization: 'authorized',
  eligible: 'authorized',
  permitted: 'authorized',
  sponsor: 'sponsorship',
  visa: 'sponsorship',
  open: 'willing',
  relocating: 'relocate',
  relocation: 'relocate',
  move: 'relocate',
  onsite: 'office',
  'on-site': 'office',
  hybrid: 'office',
  years: 'year',
  need: 'require',
  needs: 'require',
  required: 'require',
  working: 'work',
  age: 'old',
  older: 'old',
  over: 'old',
}

export function questionTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w) && w.length > 1)
    .map((w) => SYNONYMS[w] || w)
}

// Share of the saved question's meaningful words that appear in the form's question.
// `overlap` (shared words / all words) breaks ties in favour of the more specific question.
function scores(savedQuestion, formQuestion) {
  const a = new Set(questionTokens(savedQuestion))
  const b = new Set(questionTokens(formQuestion))
  if (!a.size || !b.size) return { coverage: 0, overlap: 0 }
  let hit = 0
  for (const w of a) if (b.has(w)) hit++
  return { coverage: hit / a.size, overlap: hit / new Set([...a, ...b]).size }
}

export function similarity(savedQuestion, formQuestion) {
  return scores(savedQuestion, formQuestion).coverage
}

// 0.6: "authorized to work in this country" still matches "…work in India" (2 of 3 words).
const THRESHOLD = 0.6

// Best saved answer for a form question, or null.
export function matchAnswer(formQuestion, answers = []) {
  let best = null
  for (const item of answers) {
    if (!item?.question?.trim() || item.answer == null || String(item.answer).trim() === '') continue
    const { coverage, overlap } = scores(item.question, formQuestion)
    if (coverage < THRESHOLD) continue
    if (!best || coverage > best.score || (coverage === best.score && overlap > best.overlap)) {
      best = { ...item, score: coverage, overlap }
    }
  }
  return best
}

// Starting points offered in settings ("Add common questions").
export const COMMON_QUESTIONS = [
  { question: 'Are you legally authorized to work in this country?', answer: 'Yes' },
  { question: 'Will you now or in the future require visa sponsorship?', answer: 'No' },
  { question: 'Are you willing to relocate?', answer: 'Yes' },
  { question: 'Are you comfortable working from the office?', answer: 'Yes' },
  { question: 'Are you at least 18 years old?', answer: 'Yes' },
  { question: 'How did you hear about this job?', answer: 'LinkedIn' },
]
