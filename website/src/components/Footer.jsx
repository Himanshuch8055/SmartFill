import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { GITHUB_URL, ISSUES_URL, REPORT_SITE_URL, CONTACT_EMAIL } from '../utils/links'

function Col({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-fg-muted">{children}</ul>
    </div>
  )
}

const item = 'hover:text-fg rounded outline-none focus-visible:ring-2 focus-visible:ring-focus/60'

export default function Footer() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="container-site py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="font-semibold">SmartFill</span>
          </div>
          <p className="mt-3 text-sm text-fg-muted max-w-xs">Fill any form in one click. Free and open source under the MIT license.</p>
        </div>
        <Col title="Product">
          <li><a className={item} href="/#features">Features</a></li>
          <li><Link className={item} to="/changelog">Changelog</Link></li>
          <li><Link className={item} to="/privacy">Privacy policy</Link></li>
        </Col>
        <Col title="Open source">
          <li><a className={item} href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a></li>
          <li><a className={item} href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">Contributing</a></li>
        </Col>
        <Col title="Help">
          <li><a className={item} href={REPORT_SITE_URL} target="_blank" rel="noreferrer">Report a site</a></li>
          <li><a className={item} href={ISSUES_URL} target="_blank" rel="noreferrer">Report a bug</a></li>
          <li><a className={item} href={`mailto:${CONTACT_EMAIL}`}>Contact</a></li>
        </Col>
      </div>
      <div className="container-site pb-10 text-xs text-fg-subtle">© {new Date().getFullYear()} Himanshu Chauhan</div>
    </footer>
  )
}
