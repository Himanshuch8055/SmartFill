import React from 'react'
import { Link } from 'react-router-dom'
import { GITHUB_URL, CONTACT_EMAIL } from '../utils/links'

const UPDATED = 'October 9, 2026'

export default function PrivacyPage() {
  React.useEffect(() => {
    document.title = 'Privacy policy · SmartFill'
  }, [])
  return (
    <article className="container-site max-w-3xl pt-16 pb-8">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Privacy policy</h1>
      <p className="mt-3 text-sm text-fg-subtle">Last updated {UPDATED}</p>

      <div className="prose-site mt-8">
        <p>
          SmartFill is a browser extension that fills web forms with details you save. It is built so that your information never
          leaves your browser.
        </p>

        <h2>What SmartFill stores</h2>
        <p>
          The profiles you create (for example name, email, phone, address and work details), custom fields, fields it has learned
          for specific websites, the sites where you turned it off, and your preferences.
        </p>
        <p>
          All of this is saved only in your browser’s extension storage on your device. It is not synced to any SmartFill server.
          There is no SmartFill server.
        </p>

        <h2>What SmartFill does not collect</h2>
        <ul>
          <li>No analytics, tracking or telemetry.</li>
          <li>No browsing history. SmartFill looks at the form fields on the page you are on only to decide what to fill.</li>
          <li>No passwords, payment card numbers, one-time codes or government ID numbers. SmartFill skips those fields.</li>
          <li>Nothing is sold or shared with anyone.</li>
        </ul>

        <h2>Permissions and why they are needed</h2>
        <ul>
          <li><strong>Access to the pages you visit</strong>: to find form fields, show the SmartFill button on pages with forms, and fill them when you ask.</li>
          <li><strong>Storage</strong>: to save your profiles and settings on your device.</li>
          <li><strong>Active tab</strong>: to fill the page you are on from the toolbar or a keyboard shortcut.</li>
          <li><strong>Context menus</strong>: to add “Fill this field with…” to the right-click menu.</li>
        </ul>

        <h2>Your control</h2>
        <p>
          You can edit or delete any profile at any time, turn SmartFill off for specific sites, export a backup file, and remove all
          data by uninstalling the extension. Backup files are saved wherever you choose and are never uploaded by SmartFill.
        </p>

        <h2>Open source</h2>
        <p>
          SmartFill’s source code is public on <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>, so anyone can verify
          these statements.
        </p>

        <h2>Changes and contact</h2>
        <p>
          If this policy changes, the date above will be updated and the change noted in the <Link to="/changelog">changelog</Link>.
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </article>
  )
}
