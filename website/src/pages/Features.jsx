import React from 'react'

export default function FeaturesPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">Features</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl">All the ways SmartFill saves you time and protects your privacy.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">One-click autofill</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Fill complex forms in seconds with smart detection.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Private by default</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Your data stays on your device unless you choose otherwise.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Profiles</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Maintain multiple profiles for work, personal, and more.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Keyboard-first</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Quick actions and shortcuts for power users.</p>
        </div>
      </div>
    </main>
  )
}
