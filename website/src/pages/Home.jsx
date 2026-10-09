import React from 'react'
import { Link } from 'react-router-dom'
import { Lock, ShieldCheck, Code2, ChevronDown, Check, Minus, Heart, Github, Coffee, Undo2 } from 'lucide-react'
import InstallButtons, { STORES_SOON, storesLive } from '../components/InstallButtons'
import LiveDemo from '../components/LiveDemo'
import Logo from '../components/Logo'
import { GITHUB_URL, REPORT_SITE_URL, SUPPORT_LINKS } from '../utils/links'

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

function SectionIntro({ eyebrow, title, text, center }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 h-section text-balance">{title}</h2>
      {text && <p className="mt-4 lead">{text}</p>}
    </div>
  )
}

// ---------- Hero ----------

function Hero() {
  const trust = ['Free and open source', 'No account needed', 'Works offline', 'Chrome, Edge, Brave and Firefox']
  return (
    <section className="relative overflow-hidden">
      {/* Soft brand glow behind the product */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-20%] h-[640px] w-[760px] rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute left-[-15%] top-[30%] h-[420px] w-[520px] rounded-full bg-[#a5b4fc]/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_70%,rgb(var(--sf-bg)))]" />
      </div>

      <div className="container-site pt-16 sm:pt-24 pb-16 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[13px] text-fg-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Version 1.0 · free and open source
          </p>
          <h1 className="mt-6 text-[44px] sm:text-[60px] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
            Fill any form in one click.
          </h1>
          <p className="mt-6 lead max-w-xl">
            SmartFill fills sign-up, checkout and job-application forms from details you save once. It shows you what it will fill,
            and your data never leaves your browser.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InstallButtons hideNote />
            <a href="#demo" className="btn btn-secondary">Try the demo</a>
          </div>
          {!storesLive && <p className="mt-3 text-sm text-fg-subtle">{STORES_SOON}</p>}
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-muted">
            {trust.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check size={15} className="text-success" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="-my-12 -mx-6 lg:-mr-16">
          <Shot
            name="hero-preview"
            width="960"
            height="820"
            eager
            alt="SmartFill highlighting the fields it will fill on a job application form, with the value for each field and a Fill 11 fields button"
          />
        </div>
      </div>
    </section>
  )
}

// ---------- Demo ----------

function Demo() {
  return (
    <section id="demo" className="container-site py-20 grid lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] gap-12 items-start">
      <div className="lg:sticky lg:top-28">
        <SectionIntro
          eyebrow="Try it"
          title="See it fill a real form"
          text="This is how SmartFill works on any website. It highlights each field with the value it will get. Skip anything you don’t want, then fill."
        />
        <ol className="mt-8 space-y-4 text-[15px]">
          {['Click “Fill with SmartFill”', 'Click a label to skip that field', 'Press Fill, then try Undo'].map((t, i) => (
            <li key={t} className="flex items-center gap-3">
              <span className="h-7 w-7 shrink-0 rounded-full bg-accent-subtle text-accent-text grid place-items-center text-[13px] font-semibold">{i + 1}</span>
              <span className="text-fg-muted">{t}</span>
            </li>
          ))}
        </ol>
      </div>
      <LiveDemo />
    </section>
  )
}

// ---------- Features (cards with small, real visuals) ----------

function Card({ title, text, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-6 flex flex-col ${className}`}>
      <div className="flex-1 min-h-[132px] flex items-center">{children}</div>
      <h3 className="mt-6 text-[17px] font-semibold">{title}</h3>
      <p className="mt-2 text-[15px] text-fg-muted leading-relaxed">{text}</p>
    </div>
  )
}

function Row({ label, value, state }) {
  const styles = {
    fill: 'text-fg',
    skip: 'text-fg-subtle line-through',
    lock: 'text-fg-subtle',
  }
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-line last:border-0 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className={`flex items-center gap-1.5 ${styles[state]}`}>
        {state === 'fill' && <Check size={14} className="text-success" aria-hidden />}
        {state === 'lock' && <Lock size={13} aria-hidden />}
        {value}
      </span>
    </div>
  )
}

const kbd = 'inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-line border-b-[3px] bg-surface px-2 text-[13px] font-medium text-fg-muted'

function Features() {
  return (
    <section id="features" className="container-site py-20">
      <SectionIntro eyebrow="Features" title="Careful where it counts, quick everywhere else" />
      <div className="mt-12 grid md:grid-cols-6 gap-4">
        <Card
          className="md:col-span-4"
          title="Fills the right field, leaves the rest"
          text="It reads labels, field names and the browser’s own hints. “First name” never gets your full name, unrelated fields are left alone, and sensitive fields are never touched."
        >
          <div className="w-full max-w-md rounded-xl border border-line bg-bg px-4 py-1.5">
            <Row label="First name" value="Asha" state="fill" />
            <Row label="Last name" value="Verma" state="fill" />
            <Row label="Hotel name" value="not a profile field" state="skip" />
            <Row label="Card number" value="never filled" state="lock" />
          </div>
        </Card>
        <Card className="md:col-span-2" title="Preview and undo" text="Check every value before it’s filled. Changed your mind? One click puts the form back.">
          <div className="w-full space-y-3">
            <div className="relative rounded-md border-2 border-accent bg-accent/[0.06] h-10">
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-fg">
                Email <span className="font-normal opacity-90">asha@example.com</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-fg-muted">
              Filled 11 fields. <span className="inline-flex items-center gap-1 font-medium text-accent-text"><Undo2 size={14} aria-hidden /> Undo</span>
            </div>
          </div>
        </Card>
        <Card className="md:col-span-2" title="Learns your sites" text="Correct a field once and SmartFill offers to remember it for that website.">
          <div className="w-full rounded-xl border border-line bg-bg p-3.5 text-sm shadow-sf-sm">
            <p className="text-fg">Always fill this field with your Email on jobs.lever.co?</p>
            <div className="mt-3 flex justify-end gap-2">
              <span className="rounded-md border border-line px-2.5 py-1 text-[12px] text-fg-muted">Not now</span>
              <span className="rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-fg">Remember</span>
            </div>
          </div>
        </Card>
        <Card className="md:col-span-2" title="Profiles" text="Separate details for work, personal life and job hunting. Switch from the toolbar.">
          <div className="flex flex-wrap gap-2">
            {['Work', 'Personal', 'Job hunting', 'Testing'].map((p, i) => (
              <span key={p} className={`rounded-full px-3 py-1.5 text-sm ${i === 0 ? 'bg-accent text-accent-fg' : 'border border-line bg-bg text-fg-muted'}`}>{p}</span>
            ))}
          </div>
        </Card>
        <Card className="md:col-span-2" title="Keyboard and right-click" text="Fill the page without reaching for the mouse, or right-click any field to fill just that one.">
          <div className="flex items-center gap-1.5">
            <span className={kbd}>Alt</span><span className="text-fg-subtle">+</span>
            <span className={kbd}>Shift</span><span className="text-fg-subtle">+</span>
            <span className={kbd}>F</span>
          </div>
        </Card>
        <Card
          className="md:col-span-3"
          title="Ready for job applications"
          text="Works on Greenhouse, Lever and other application forms, including the questions most autofill tools skip."
        >
          <div className="flex flex-wrap gap-2">
            {['LinkedIn', 'GitHub', 'Portfolio', 'Years of experience', 'Notice period', 'Expected salary'].map((t) => (
              <span key={t} className="rounded-md border border-line bg-bg px-2.5 py-1 text-sm text-fg-muted">{t}</span>
            ))}
          </div>
        </Card>
        <Card className="md:col-span-3" title="All your details in one calm place" text="Edit any profile in settings. Changes save as you type, and custom fields cover anything else a form asks.">
          <div className="w-full h-[150px] overflow-hidden rounded-lg">
            <Shot name="settings" width="980" height="820" alt="SmartFill settings page with a list of profiles and the Work profile details" className="max-w-none w-[118%] -ml-[9%] -mt-[8%]" />
          </div>
        </Card>
      </div>
    </section>
  )
}

// ---------- Comparison ----------

const COMPARE = [
  ['Fills names, email, phone and address', true, true],
  ['Shows what it will fill first', true, false],
  ['Undo a fill', true, false],
  ['Job-application fields (LinkedIn, notice period, salary…)', true, false],
  ['Custom fields for anything else', true, false],
  ['Remembers corrections for each site', true, false],
  ['Separate profiles you can switch between', true, 'Limited'],
  ['Google Forms', true, 'Rarely'],
]

function Mark({ value }) {
  if (value === true) return <Check size={18} className="mx-auto text-success" aria-label="Yes" />
  if (value === false) return <Minus size={18} className="mx-auto text-fg-subtle" aria-label="No" />
  return <span className="text-sm text-fg-muted">{value}</span>
}

function Compare() {
  return (
    <section id="compare" className="container-site py-20">
      <SectionIntro
        eyebrow="Compare"
        title="Why not just use the browser’s autofill?"
        text="Browser autofill is great for addresses. SmartFill covers the rest of the form, and lets you check before anything changes."
      />
      <div className="mt-10 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-4 pl-6 pr-4 text-sm font-medium text-fg-muted">Feature</th>
              <th scope="col" className="py-4 px-4 w-40 text-center">
                <span className="inline-flex items-center gap-2 text-sm font-semibold"><Logo size={18} /> SmartFill</span>
              </th>
              <th scope="col" className="py-4 pl-4 pr-6 w-40 text-center text-sm font-medium text-fg-muted">Browser autofill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {COMPARE.map(([feature, a, b]) => (
              <tr key={feature}>
                <th scope="row" className="py-3.5 pl-6 pr-4 text-[15px] font-normal">{feature}</th>
                <td className="py-3.5 px-4 text-center bg-accent/[0.04]"><Mark value={a} /></td>
                <td className="py-3.5 pl-4 pr-6 text-center"><Mark value={b} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ---------- How it works ----------

const STEPS = [
  { title: 'Save your details once', text: 'Add a profile for work, personal life or job hunting. It stays in your browser.' },
  { title: 'Open any form', text: 'SmartFill finds the fields it can fill: names, email, phone, address, links and more.' },
  { title: 'Fill, check, done', text: 'Click the toolbar button or the button at the edge of the page. Undo is one click.' },
]

function HowItWorks() {
  return (
    <section id="how" className="container-site py-20 grid lg:grid-cols-[minmax(0,1fr)_460px] gap-12 items-center">
      <div>
        <SectionIntro eyebrow="How it works" title="Set up once. Then it’s one click." />
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
      <div className="w-full max-w-[520px] mx-auto -my-10">
        <Shot
          name="popup"
          width="520"
          height="480"
          alt="The SmartFill popup showing the current site, 11 fields detected, a Fill 11 fields button, and switches for preview and the current site"
        />
      </div>
    </section>
  )
}

// ---------- Privacy ----------

function Privacy() {
  const points = [
    { icon: Lock, title: 'Stays in your browser', text: 'No account, no server, no analytics. SmartFill never sends your details anywhere.' },
    { icon: ShieldCheck, title: 'Hands off sensitive fields', text: 'Passwords, card numbers, one-time codes and ID numbers are never filled or read.' },
    { icon: Code2, title: 'Open source', text: 'Every line of code is public on GitHub, so anyone can check what it does.' },
  ]
  return (
    <section id="privacy" className="container-site py-20">
      <div className="relative overflow-hidden rounded-3xl bg-[#1e1b4b] px-6 py-14 sm:px-12 text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#6366f1]/40 blur-3xl" />
        <p className="relative text-[13px] font-semibold tracking-wide text-[#a5b4fc]">Privacy</p>
        <h2 className="relative mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.025em]">Private by design</h2>
        <div className="relative mt-10 grid md:grid-cols-3 gap-10">
          {points.map((p) => (
            <div key={p.title}>
              <p.icon size={22} className="text-[#a5b4fc]" aria-hidden />
              <h3 className="mt-4 text-[17px] font-semibold">{p.title}</h3>
              <p className="mt-2 text-[#c7c9f5] leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="relative mt-10 text-sm text-[#c7c9f5]">
          Read the full <Link className="underline underline-offset-4 hover:text-white" to="/privacy">privacy policy</Link> or the{' '}
          <a className="underline underline-offset-4 hover:text-white" href={GITHUB_URL} target="_blank" rel="noreferrer">source code</a>.
        </p>
      </div>
    </section>
  )
}

// ---------- Support (shown only when support links are configured) ----------

const SUPPORT_ICONS = { github: Github, bmc: Coffee, kofi: Coffee }

function Support() {
  if (!SUPPORT_LINKS.length) return null
  return (
    <section id="support" className="container-site py-20">
      <div className="rounded-3xl border border-line bg-surface px-6 py-12 sm:px-12 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 items-center">
        <div>
          <Heart size={24} className="text-[#e11d48]" aria-hidden />
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em]">Support SmartFill</h2>
          <p className="mt-3 text-fg-muted leading-relaxed max-w-md">
            SmartFill is free, has no ads and never will. If it saves you time, a small contribution helps keep it maintained and improving.
          </p>
        </div>
        <div className="space-y-3">
          {SUPPORT_LINKS.map((s) => {
            const Icon = SUPPORT_ICONS[s.id]
            return (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 rounded-xl border border-line bg-bg px-5 py-4 hover:border-line-strong outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
              >
                <Icon size={20} className="text-fg-muted" aria-hidden />
                <span className="flex-1">
                  <span className="block font-medium">{s.label}</span>
                  <span className="block text-sm text-fg-muted">{s.note}</span>
                </span>
                <span aria-hidden className="text-fg-subtle">↗</span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------- FAQ ----------

const FAQ = [
  { q: 'Is SmartFill free?', a: 'Yes. It’s free and open source under the MIT license, with no paid tier and no ads.' },
  { q: 'Where is my information stored?', a: 'Only in your browser’s extension storage, on your device. SmartFill has no account and no server, and it sends nothing anywhere.' },
  { q: 'Will it fill passwords or card numbers?', a: 'No. SmartFill never fills or reads password, payment card, one-time code or government ID fields.' },
  { q: 'Which browsers does it work in?', a: 'Chrome, Edge, Brave and other Chromium browsers, and Firefox.' },
  { q: 'Does it work on Google Forms and modern web apps?', a: 'Yes. It fills Google Forms and forms built with React, Vue or Angular, where many autofill tools fail.' },
  {
    q: 'A site didn’t fill correctly. What can I do?',
    a: (
      <>
        Correct the field and choose <strong>Remember</strong>, and SmartFill will get it right on that site next time. Please also{' '}
        <a className="link" href={REPORT_SITE_URL} target="_blank" rel="noreferrer">report the site</a> so detection improves for everyone.
      </>
    ),
  },
  { q: 'Can I move my profiles to another browser?', a: 'Yes. Export a backup file from the Backup page in settings and restore it in the other browser.' },
]

function Faq() {
  return (
    <section id="faq" className="container-site py-20 grid lg:grid-cols-[320px_minmax(0,1fr)] gap-12">
      <SectionIntro eyebrow="FAQ" title="Questions" />
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
    <section className="container-site py-20">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-16 text-center">
        <div aria-hidden className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-72 w-[600px] rounded-full bg-accent/20 blur-[100px]" />
        <Logo size={44} className="relative mx-auto" />
        <h2 className="relative mt-6 h-section">Stop retyping your details.</h2>
        <p className="relative mt-4 lead">Set it up in a minute. It’s free.</p>
        <InstallButtons className="relative mt-8 justify-center" noteBelow />
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Demo />
      <Features />
      <Compare />
      <HowItWorks />
      <Privacy />
      <Support />
      <Faq />
      <FinalCta />
    </>
  )
}
