import React from 'react'

export default function DocsPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">Documentation</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl">Guides and tips to make the most out of SmartFill.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">Getting started</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Install and create your first profile in minutes.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Advanced usage</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Shortcuts, profiles, and power features.</p>
        </div>
      </div>
    </main>
  )
}
