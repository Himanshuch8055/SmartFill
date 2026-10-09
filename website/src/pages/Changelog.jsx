import React from 'react'
import changelog from '../../../CHANGELOG.md?raw' // the repo's CHANGELOG.md, read at build time
import { renderChangelog } from '../utils/markdown'
import { GITHUB_URL } from '../utils/links'

// The "Unreleased" section is for contributors; visitors only see released versions.
const released = changelog.replace(/## \[Unreleased\][\s\S]*?(?=\n## \[)/, '')

export default function ChangelogPage() {
  React.useEffect(() => {
    document.title = 'Changelog · SmartFill'
  }, [])
  return (
    <article className="container-site max-w-3xl pt-16 pb-8">
      <p className="eyebrow">What’s new</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Changelog</h1>
      <p className="mt-3 text-fg-muted">
        Every release of SmartFill. Upcoming changes are listed in{' '}
        <a className="link" href={`${GITHUB_URL}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer">CHANGELOG.md</a> on GitHub.
      </p>
      <div className="prose-site mt-4">{renderChangelog(released)}</div>
    </article>
  )
}
