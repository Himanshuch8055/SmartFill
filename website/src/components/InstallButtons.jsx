import React from 'react'
import { CHROME_URL, FIREFOX_URL, INSTALL_FROM_SOURCE_URL } from '../utils/links'

// Store buttons. Before the store listings exist, the primary button explains how to install
// from source instead of linking nowhere.
export default function InstallButtons({ size = 'lg', className = '', noteBelow = false }) {
  const small = size === 'sm'
  if (!CHROME_URL && !FIREFOX_URL) {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${noteBelow ? 'flex-col' : ''} ${className}`}>
        <a className={`btn btn-primary ${small ? 'btn-sm' : ''}`} href={INSTALL_FROM_SOURCE_URL} target="_blank" rel="noreferrer">
          Install from GitHub
        </a>
        {!small && <span className="text-sm text-fg-subtle">Chrome Web Store and Firefox Add-ons listings coming soon.</span>}
      </div>
    )
  }
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {CHROME_URL && (
        <a className={`btn btn-primary ${small ? 'btn-sm' : ''}`} href={CHROME_URL} target="_blank" rel="noreferrer">
          Add to Chrome
        </a>
      )}
      {FIREFOX_URL && (
        <a className={`btn ${CHROME_URL ? 'btn-secondary' : 'btn-primary'} ${small ? 'btn-sm' : ''}`} href={FIREFOX_URL} target="_blank" rel="noreferrer">
          Add to Firefox
        </a>
      )}
    </div>
  )
}
