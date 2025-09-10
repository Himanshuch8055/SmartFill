import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 border-t border-slate-200/70 dark:border-white/10 text-sm">
      {/* Top section */}
      <div className="container-app py-12 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Brand + CTA */}
        <div className="md:col-span-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="SmartFill logo" className="h-7 w-7 rounded" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">SmartFill</span>
          </div>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Lightning-fast, privacy-first autofill that saves you time on every form.
          </p>
          <Link to="/install" className="btn btn-primary mt-4 inline-flex">Get the Extension</Link>
        </div>

        {/* Link groups */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold">Product</h3>
            <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/features">Features</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/how">How it works</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/faq">FAQ</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/install">Install</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold">Resources</h3>
            <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/docs">Docs</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/changelog">Changelog</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/status">Status</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold">Company</h3>
            <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/privacy">Privacy</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/terms">Terms</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="md:col-span-12 lg:col-span-12">
          <div className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">Stay in the loop</h4>
              <p className="text-slate-600 dark:text-slate-400">Product updates, tips, and occasional release notes. No spam.</p>
            </div>
            <form
              className="w-full md:w-auto flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); }}
            >
              <label htmlFor="newsletter-email" className="sr-only">Email</label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full md:w-72 rounded-xl border border-slate-200 dark:border-[#20304d] bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200/70 dark:border-white/10">
        <div className="container-app py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
          <div>© {year} SmartFill. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link className="hover:text-slate-900 dark:hover:text-white" to="/privacy">Privacy</Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" to="/terms">Terms</Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" to="/status">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
