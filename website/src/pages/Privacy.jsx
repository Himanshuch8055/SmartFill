import React from 'react'

export default function PrivacyPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">Privacy Policy</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl">We respect your privacy and minimize data collection. Your form data stays on your device by default.</p>
      <div className="mt-6 space-y-4 text-slate-600 dark:text-slate-400">
        <p>We do not sell your personal information. If analytics are enabled, they are anonymous and aggregate.</p>
        <p>Contact us to request data deletion or to ask privacy-related questions.</p>
      </div>
    </main>
  )
}
