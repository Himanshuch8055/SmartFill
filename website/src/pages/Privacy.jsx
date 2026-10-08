import React from 'react'

const UPDATED = 'October 8, 2026'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-600 dark:text-slate-400">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <main className="container-app py-10 max-w-3xl">
      <h1 className="h1">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {UPDATED}</p>
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        SmartFill is a browser extension that fills web forms with details you save. It is built so that your
        information never leaves your browser.
      </p>

      <Section title="What SmartFill stores">
        <p>
          The profiles you create (for example name, email, phone, address and work details), custom fields, site rules,
          the list of sites where you turned SmartFill off, and your preferences.
        </p>
        <p>
          All of this is saved only in your browser's local extension storage on your device. It is not synced to any
          SmartFill server. We do not operate a server that receives it.
        </p>
      </Section>

      <Section title="What SmartFill does not collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>No analytics, tracking, or telemetry.</li>
          <li>No browsing history. SmartFill reads form fields on the page you are on only to decide what to fill.</li>
          <li>No passwords, payment card numbers, one-time codes, or government ID numbers. SmartFill skips those fields.</li>
          <li>Nothing is sold or shared with third parties.</li>
        </ul>
      </Section>

      <Section title="Permissions and why they are needed">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Access to the pages you visit</b>: to detect form fields, show the on-page button, count fillable fields, and fill forms when you ask.</li>
          <li><b>Storage</b>: to save your profiles and settings on your device.</li>
          <li><b>Active tab</b>: to fill the page you are on from the toolbar or a keyboard shortcut.</li>
          <li><b>Context menus</b>: to add "Fill this field with…" to the right-click menu.</li>
        </ul>
      </Section>

      <Section title="Your control">
        <p>
          You can edit or delete any profile at any time, export a backup file, turn SmartFill off for specific sites, and
          remove all data by uninstalling the extension. Backup files you export are saved wherever you choose and are
          not uploaded by SmartFill.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If this policy changes, the date above will be updated and the change will be noted in the changelog. Questions?
          Reach us through the <a className="underline" href="/contact">contact page</a>.
        </p>
      </Section>
    </main>
  )
}
