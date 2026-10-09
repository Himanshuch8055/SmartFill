import React from 'react'
import { Link } from 'react-router-dom'
import { ScanText, Eye, BookmarkCheck, Users, Briefcase, Keyboard, Lock, ShieldCheck, Code2, ChevronDown } from 'lucide-react'
import InstallButtons from '../components/InstallButtons'
import { GITHUB_URL, REPORT_SITE_URL } from '../utils/links'

// A product shot with light and dark versions (images/<name>.png and <name>-dark.png).
function Shot({ name, width, height, alt, className = '', eager }) {
  const common = { width, height, alt, loading: eager ? 'eager' : 'lazy', className: `w-full h-auto ${className}` }
  return (
    <>
      <img src={`/images/${name}.png`} {...common} className={`img-light ${common.className}`} fetchpriority={eager ? 'high' : undefined} />
      <img src={`/images/${name}-dark.png`} {...common} className={`img-dark ${common.className}`} alt="" aria-hidden="true" />
    </>
  )
}

const STEPS = [
  { title: 'Save your details once', text: 'Add a profile for work, personal life or job hunting. It stays in your browser.' },
  { title: 'Open any form', text: 'SmartFill finds the fields it can fill: names, email, phone, address, links and more.' },
  { title: 'Fill, check, done', text: 'See what goes where, skip anything you like, then confirm. Undo is one click.' },
]

const FEATURES = [
  {
    icon: ScanText,
    title: 'Fills the right field',
    text: 'It reads labels, field names and the browser’s own hints, so “First name” never gets your full name and “Hotel name” is left alone.',
  },
  {
    icon: Eye,
    title: 'Preview and undo',
    text: 'Every field is highlighted with the value it will get before anything changes. Click a label to skip that field.',
  },
  {
    icon: BookmarkCheck,
    title: 'Learns your sites',
    text: 'Correct a field once and SmartFill offers to remember it for that website.',
  },
  {
    icon: Users,
    title: 'Profiles',
    text: 'Keep separate details for work, personal and testing. Switch from the toolbar or with Alt+Shift+P.',
  },
  {
    icon: Briefcase,
    title: 'Ready for job applications',
    text: 'LinkedIn, GitHub, portfolio, experience, notice period and salary fields, on Greenhouse, Lever and other application forms.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard and right-click',
    text: 'Alt+Shift+F fills the page. Right-click any field to fill just that one.',
  },
]

const FAQ = [
  {
    q: 'Is SmartFill free?',
    a: 'Yes. It’s free and open source under the MIT license, with no paid tier and no ads.',
  },
  {
    q: 'Where is my information stored?',
    a: 'Only in your browser’s extension storage, on your device. SmartFill has no account and no server, and it sends nothing anywhere.',
  },
  {
    q: 'Will it fill passwords or card numbers?',
    a: 'No. SmartFill never fills or reads password, payment card, one-time code or government ID fields.',
  },
  {
    q: 'Which browsers does it work in?',
    a: 'Chrome, Edge, Brave and other Chromium browsers, and Firefox.',
  },
  {
    q: 'Does it work on Google Forms and modern web apps?',
    a: 'Yes. It fills Google Forms and forms built with React, Vue or Angular, where many autofill tools fail.',
  },
  {
    q: 'A site didn’t fill correctly. What can I do?',
    a: (
      <>
        Correct the field and choose <strong>Remember</strong>, and SmartFill will get it right on that site next time. Please also{' '}
        <a className="link" href={REPORT_SITE_URL} target="_blank" rel="noreferrer">report the site</a> so detection improves for everyone.
      </>
    ),
  },
  {
    q: 'Can I move my profiles to another browser?',
    a: 'Yes. Export a backup file from the Backup page in settings and restore it in the other browser.',
  },
]

function Hero() {
  return (
    <section className="container-site pt-16 sm:pt-24 pb-12 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 items-center">
      <div>
        <p className="eyebrow">Free and open source browser extension</p>
        <h1 className="mt-4 text-[44px] sm:text-[56px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance">
          Fill any form in one click.
        </h1>
        <p className="mt-6 lead max-w-xl">
          SmartFill fills sign-up, checkout and job-application forms from details you save once. It shows you what it will fill,
          and your data never leaves your browser.
        </p>
        <InstallButtons className="mt-8" />
        <p className="mt-4 text-sm text-fg-subtle">Works in Chrome, Edge, Brave and Firefox.</p>
      </div>
      <div className="-my-6 lg:-mr-10">
        <Shot
          name="hero-preview"
          width="860"
          height="720"
          eager
          alt="SmartFill highlighting the fields it will fill on a job application form, with the value for each field and a Fill 11 fields button"
        />
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="container-site py-20 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-12 items-center">
      <div>
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 h-section">Three steps, then it’s just one click</h2>
        <ol className="mt-10 space-y-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-5">
              <span className="h-8 w-8 shrink-0 rounded-full bg-accent-subtle text-accent-text grid place-items-center text-sm font-semibold">{i + 1}</span>
              <div>
                <h3 className="text-[17px] font-semibold">{s.title}</h3>
                <p className="mt-1 text-fg-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="w-full max-w-[420px] mx-auto">
        <Shot
          name="popup"
          width="420"
          height="380"
          alt="The SmartFill popup showing the current site, 11 fields detected, a Fill 11 fields button, and switches for preview and the current site"
        />
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="container-site py-20">
      <p className="eyebrow">Features</p>
      <h2 className="mt-3 h-section max-w-2xl">Accurate, careful, and quick to use</h2>
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <f.icon size={22} className="text-accent-text" aria-hidden />
            <h3 className="mt-4 text-[17px] font-semibold">{f.title}</h3>
            <p className="mt-2 text-fg-muted leading-relaxed">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-24 grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-12 items-center">
        <div>
          <h3 className="text-2xl font-semibold tracking-[-0.02em]">All your details in one calm place</h3>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Edit any profile from the settings page. Changes save as you type. Custom fields cover anything a form asks that isn’t
            built in, and you can see and remove everything SmartFill has learned about each site.
          </p>
        </div>
        <div>
          <Shot name="settings" width="880" height="720" alt="SmartFill settings page with a list of profiles and the details for the Work profile" />
        </div>
      </div>
    </section>
  )
}

function Privacy() {
  const points = [
    { icon: Lock, title: 'Stays in your browser', text: 'No account, no server, no analytics. SmartFill never sends your details anywhere.' },
    { icon: ShieldCheck, title: 'Hands off sensitive fields', text: 'Passwords, card numbers, one-time codes and ID numbers are never filled or read.' },
    { icon: Code2, title: 'Open source', text: 'Every line of code is public on GitHub, so anyone can check what it does.' },
  ]
  return (
    <section id="privacy" className="container-site py-20">
      <div className="rounded-3xl border border-line bg-surface px-6 py-12 sm:px-12">
        <p className="eyebrow">Privacy</p>
        <h2 className="mt-3 h-section">Private by design</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-10">
          {points.map((p) => (
            <div key={p.title}>
              <p.icon size={22} className="text-accent-text" aria-hidden />
              <h3 className="mt-4 text-[17px] font-semibold">{p.title}</h3>
              <p className="mt-2 text-fg-muted leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-fg-muted">
          Read the full <Link className="link" to="/privacy">privacy policy</Link> or the{' '}
          <a className="link" href={GITHUB_URL} target="_blank" rel="noreferrer">source code</a>.
        </p>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className="container-site py-20 grid lg:grid-cols-[320px_minmax(0,1fr)] gap-12">
      <div>
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-3 h-section">Questions</h2>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium rounded outline-none focus-visible:ring-2 focus-visible:ring-focus/60 [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown size={18} className="shrink-0 text-fg-subtle transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-3 pr-10 text-fg-muted leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="container-site py-20 text-center">
      <h2 className="h-section">Stop retyping your details.</h2>
      <p className="mt-4 lead">Set it up in a minute. It’s free.</p>
      <InstallButtons className="mt-8 justify-center" noteBelow />
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Privacy />
      <Faq />
      <FinalCta />
    </>
  )
}
