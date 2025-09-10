import React from 'react'

export default function HowPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">How it works</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl">A quick overview of SmartFill in action.</p>
      <ol className="mt-8 grid gap-6 sm:grid-cols-2">
        <li className="card">
          <h3 className="font-semibold">1. Install</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Add SmartFill to your browser in one click.</p>
        </li>
        <li className="card">
          <h3 className="font-semibold">2. Create a profile</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Securely store your info locally with optional encryption.</p>
        </li>
        <li className="card">
          <h3 className="font-semibold">3. Autofill</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Open a form, click SmartFill, and you're done.</p>
        </li>
        <li className="card">
          <h3 className="font-semibold">4. Review & submit</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Quickly review the pre-filled fields and submit.</p>
        </li>
      </ol>
    </main>
  )
}
