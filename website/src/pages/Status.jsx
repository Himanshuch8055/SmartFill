import React from 'react'

export default function StatusPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">Status</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">All systems operational.</p>
      <div className="mt-6 card">
        <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400">
          <li>Website: Operational</li>
          <li>Extension updates: Operational</li>
        </ul>
      </div>
    </main>
  )
}
