import React from 'react'

export default function FAQPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">FAQ</h1>
      <div className="mt-6 space-y-4">
        <details className="card">
          <summary className="font-semibold cursor-pointer">Is SmartFill free?</summary>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Yes, core features are free. Optional pro features may be added later.</p>
        </details>
        <details className="card">
          <summary className="font-semibold cursor-pointer">Where is my data stored?</summary>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Locally in your browser storage. We do not collect your personal data.</p>
        </details>
        <details className="card">
          <summary className="font-semibold cursor-pointer">Does it work on all sites?</summary>
          <p className="mt-2 text-slate-600 dark:text-slate-400">SmartFill works on most forms and continuously improves.</p>
        </details>
      </div>
    </main>
  )
}
