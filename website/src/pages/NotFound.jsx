import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  React.useEffect(() => {
    document.title = 'Page not found · SmartFill'
  }, [])
  return (
    <section className="container-site max-w-xl py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">This page doesn’t exist</h1>
      <p className="mt-3 text-fg-muted">It may have moved when the site was updated.</p>
      <Link to="/" className="btn btn-secondary mt-8">Go to the home page</Link>
    </section>
  )
}
