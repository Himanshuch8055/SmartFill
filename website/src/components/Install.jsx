import React from 'react'
import { CHROME_URL, FIREFOX_URL } from '../utils/links'

export default function Install() {
  return (
    <section id="install" className="container-app py-10 md:py-14">
      <h2 className="h2 mb-2">Get SmartFill</h2>
      <p className="muted">Available for modern Chromium-based browsers and Firefox.</p>
      <div className="flex gap-3 mt-4">
        <a className="btn btn-primary" href={CHROME_URL} rel="noopener" target="_blank">Add to Chrome</a>
        <a className="btn btn-ghost" href={FIREFOX_URL} rel="noopener" target="_blank">Add to Firefox</a>
      </div>
    </section>
  )
}
