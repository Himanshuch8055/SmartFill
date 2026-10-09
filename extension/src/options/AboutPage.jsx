import React from 'react'
import { PRIVACY_URL, reviewUrl } from '../lib/links'
import { PageHeader, Group } from './layout'

const REPO = 'https://github.com/Himanshuch8055/SmartFill'

function LinkRow({ href, children, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-surface-2 outline-none focus-visible:bg-surface-2"
    >
      {children}
      <span aria-hidden className="text-fg-subtle">↗</span>
    </a>
  )
}

export default function AboutPage() {
  const version = chrome.runtime.getManifest?.().version
  return (
    <div>
      <PageHeader title="About" description={`SmartFill ${version ? `version ${version}` : ''}. Free and open source under the MIT license.`} />

      <Group title="Privacy">
        <p className="px-4 py-3 text-[13px] text-fg-muted leading-relaxed">
          Everything you save stays in this browser. SmartFill has no account, no server and no analytics, and it never fills
          passwords, card numbers, one-time codes or ID numbers.
        </p>
        <LinkRow href={PRIVACY_URL}>Privacy policy</LinkRow>
      </Group>

      <Group title="Help">
        <LinkRow href={chrome.runtime.getURL('welcome.html')}>Welcome guide</LinkRow>
        <LinkRow href={`${REPO}/issues/new?template=site_not_filling.yml`}>Report a site that doesn't fill correctly</LinkRow>
        <LinkRow href={`${REPO}/issues/new/choose`}>Report a bug or suggest a feature</LinkRow>
      </Group>

      <Group title="Project">
        <LinkRow href={REPO}>Source code on GitHub</LinkRow>
        <LinkRow href={reviewUrl()}>Rate SmartFill</LinkRow>
      </Group>
    </div>
  )
}
