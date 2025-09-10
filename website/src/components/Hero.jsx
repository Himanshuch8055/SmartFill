import React from 'react'
import { CHROME_URL, FIREFOX_URL } from '../utils/links'

export default function Hero() {
  return (
    <section className="container-app py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h1 className="h1">Autofill forms in one click</h1>
        <p className="muted mt-3 max-w-xl">
          Save time on repetitive forms. Create multiple profiles and fill any form instantly—securely
          and locally in your browser.
        </p>
        <div className="flex gap-3 mt-5">
          <a className="btn btn-primary" href={CHROME_URL} rel="noopener" target="_blank">Add to Chrome</a>
          <a className="btn btn-ghost" href={FIREFOX_URL} rel="noopener" target="_blank">Add to Firefox</a>
        </div>
        <div className="muted text-sm mt-2">Free. Open the popup, pick a profile, and done.</div>
      </div>
      <div>
        <div className="rounded-2xl border border-[#20304d] bg-[#0f172a] shadow-2xl overflow-hidden">
          <div className="h-10 bg-[#0b1220] border-b border-[#20304d] flex items-center gap-2 px-3">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          </div>
          <div className="p-4 md:p-6">
            <div className="h-10 rounded-lg bg-[#0b1220] border border-[#20304d] mb-2" />
            <div className="h-10 rounded-lg bg-[#0b1220] border border-[#20304d] mb-2" />
            <div className="h-10 rounded-lg bg-[#0b1220] border border-[#20304d] mb-2" />
            <div className="h-10 w-2/3 rounded-lg bg-[#0b1220] border border-[#20304d] mb-3" />
            <div className="inline-flex h-10 items-center rounded-xl bg-blue-600 hover:bg-blue-700 px-4 text-sm font-semibold">Autofill now</div>
          </div>
        </div>
      </div>
    </section>
  )
}
