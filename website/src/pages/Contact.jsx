import React from 'react'

export default function ContactPage() {
  return (
    <main className="container-app py-10">
      <h1 className="h1">Contact</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Have a question or feedback? Send us a message.</p>
      <form className="mt-6 max-w-xl space-y-3" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="rounded-xl border border-slate-200 dark:border-[#20304d] bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" required />
          <input className="rounded-xl border border-slate-200 dark:border-[#20304d] bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" type="email" required />
        </div>
        <textarea className="w-full rounded-xl border border-slate-200 dark:border-[#20304d] bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" rows="5" placeholder="Message" required />
        <button className="btn btn-primary" type="submit">Send</button>
      </form>
    </main>
  )
}
