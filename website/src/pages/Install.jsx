import React from 'react'
import InstallSection from '../components/Install'

export default function InstallPage() {
  return (
    <main className="flex-1">
      <section className="container-app py-10">
        <h1 className="h1">Install SmartFill</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl">Choose your browser to get started.</p>
      </section>
      <InstallSection />
    </main>
  )
}
