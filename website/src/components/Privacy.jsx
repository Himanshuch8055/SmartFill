import React from 'react'

export default function Privacy() {
  return (
    <section id="privacy" className="container-app py-10 md:py-14">
      <h2 className="h2 mb-3">Privacy-first</h2>
      <p className="muted max-w-3xl">
        SmartFill stores your profiles locally via browser storage APIs. We don’t collect personal data or
        track your browsing. You can export or delete your data anytime.
      </p>
    </section>
  )
}
