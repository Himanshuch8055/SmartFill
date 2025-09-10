import React from 'react'

const items = [
  {
    title: 'Multiple Profiles',
    desc: 'Create unlimited profiles for work, personal, and testing. Switch in one click.',
  },
  {
    title: 'Custom Inputs',
    desc: 'Add your own fields by label/placeholder and fill them automatically.',
  },
  {
    title: 'Popup Quick Select',
    desc: 'Choose which profiles appear in the popup for super fast access.',
  },
  {
    title: 'Private by Design',
    desc: 'Your data stays in your browser’s storage. Import/export anytime.',
  },
]

export default function Features() {
  return (
    <section id="features" className="container-app py-10 md:py-14">
      <h2 className="h2 mb-4">Why SmartFill?</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((f) => (
          <div key={f.title} className="card">
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="muted text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
