import React from 'react'

const faqs = [
  {
    q: 'Does SmartFill work on all websites?',
    a: 'It works on most standard forms. For niche forms, add Custom Inputs by field label or placeholder.',
  },
  {
    q: 'Is my data synced?',
    a: 'Your data is saved locally. If you use browser sync, it may sync depending on your browser settings.',
  },
  {
    q: 'Can I import/export profiles?',
    a: 'Yes. Use the Options page to export a JSON file or import from one.',
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="container-app py-10 md:py-14">
      <h2 className="h2 mb-3">FAQ</h2>
      <div className="space-y-3">
        {faqs.map(({ q, a }) => (
          <details key={q} className="card">
            <summary className="font-medium cursor-pointer">{q}</summary>
            <p className="muted mt-2 text-sm">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
