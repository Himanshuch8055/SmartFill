import React from 'react'

export default function ChangelogPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">Changelog</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Latest changes and improvements.</p>
      <ul className="mt-6 space-y-4">
        <li className="card">
          <div className="text-xs uppercase text-slate-500">v0.1.0</div>
          <div className="mt-1 font-semibold">Initial public landing page</div>
        </li>
      </ul>
    </main>
  )
}
