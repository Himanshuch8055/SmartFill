import React from 'react'
import { PRIVACY_URL, reviewUrl } from '../lib/links'
import { PageHeader, Group } from './layout'
import { t } from '../lib/i18n'

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
      <PageHeader title={t('About')} description={version ? t('SmartFill version {version}. Free and open source under the MIT license.', { version }) : t('SmartFill. Free and open source under the MIT license.')} />

      <Group title={t('Privacy')}>
        <p className="px-4 py-3 text-[13px] text-fg-muted leading-relaxed">
          {t('Everything you save stays in this browser. SmartFill has no account, no server and no analytics, and it never fills passwords, card numbers, one-time codes or ID numbers.')}
        </p>
        <LinkRow href={PRIVACY_URL}>{t('Privacy policy')}</LinkRow>
      </Group>

      <Group title={t('Help')}>
        <LinkRow href={chrome.runtime.getURL('welcome.html')}>{t('Welcome guide')}</LinkRow>
        <LinkRow href={`${REPO}/issues/new?template=site_not_filling.yml`}>{t("Report a site that doesn't fill correctly")}</LinkRow>
        <LinkRow href={`${REPO}/issues/new/choose`}>{t('Report a bug or suggest a feature')}</LinkRow>
      </Group>

      <Group title={t('Project')}>
        <LinkRow href={REPO}>{t('Source code on GitHub')}</LinkRow>
        <LinkRow href={reviewUrl()}>{t('Rate SmartFill')}</LinkRow>
      </Group>
    </div>
  )
}
