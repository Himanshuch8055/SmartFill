// Dev-only mock of the chrome.* APIs used by SmartFill, so extension pages run in a normal
// browser tab (npm run dev:ui). Storage is in-memory and persisted to localStorage; the real
// background script is loaded so pages talk to the same message handlers as in the extension.
//
// URL parameters (on the preview page or a page directly):
//   ?site=https://shop.example.com/checkout  URL of the "active tab"
//   ?fields=12                               fillable fields the content script reports
//   ?fill=instant                            AUTOFILL responds as an instant fill instead of preview
//   ?reset=1                                 restore the sample data

const STORE_KEY = 'sf-dev-storage'
const params = new URLSearchParams(location.search)

function sampleData() {
  const base = {
    middleName: '', username: '', dob: '', gender: '', phone2: '', address2: '', github: '', portfolio: '',
    yearsExperience: '', currentCtc: '', expectedCtc: '', noticePeriod: '', bio: '', customFields: [],
  }
  return {
    schemaVersion: 2,
    activeProfileId: 'work',
    profiles: [
      {
        id: 'work',
        name: 'Work',
        data: {
          ...base,
          fullName: 'Asha Verma', firstName: 'Asha', lastName: 'Verma', email: 'asha@acme.dev', phone: '+91 98765 43210',
          company: 'Acme Labs', jobTitle: 'Senior Frontend Engineer', website: 'https://asha.dev', linkedin: 'https://linkedin.com/in/asha',
          github: 'https://github.com/asha', yearsExperience: '6', noticePeriod: '30 days',
          address1: '12 MG Road', city: 'Pune', state: 'Maharashtra', zip: '411001', country: 'India',
        },
      },
      {
        id: 'personal',
        name: 'Personal',
        data: { ...base, fullName: 'Asha Verma', email: 'asha.verma@gmail.com', phone: '+91 91234 56789', city: 'Pune', country: 'India' },
      },
    ],
    rules: [
      { sitePattern: 'jobs.lever.co', selector: 'input[name="urls[GitHub]"]', key: 'github' },
      { sitePattern: 'boards.greenhouse.io', selector: '#q4', key: 'noticePeriod' },
    ],
    blockedSites: ['bank.example.com'],
    siteProfiles: { 'jobs.lever.co': 'work' },
    fillCount: 7,
  }
}

let data
try {
  data = params.has('reset') ? null : JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
} catch {}
data = data || sampleData()
const persist = () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)) } catch {}
}
persist()

function event() {
  const fns = []
  return {
    fns,
    addListener: (f) => fns.push(f),
    removeListener: (f) => { const i = fns.indexOf(f); if (i >= 0) fns.splice(i, 1) },
    hasListener: (f) => fns.includes(f),
  }
}

const onChanged = event()
const onMessage = event()
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)))

const local = {
  async get(keys) {
    if (keys == null) return clone(data)
    if (typeof keys === 'string') keys = [keys]
    if (Array.isArray(keys)) return Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, clone(data[k])]))
    return Object.fromEntries(Object.entries(keys).map(([k, d]) => [k, k in data ? clone(data[k]) : d]))
  },
  async set(obj) {
    const changes = {}
    for (const [k, v] of Object.entries(obj)) {
      changes[k] = { oldValue: clone(data[k]), newValue: clone(v) }
      data[k] = clone(v)
    }
    persist()
    onChanged.fns.forEach((f) => f(changes, 'local'))
  },
  async remove(keys) {
    const changes = {}
    for (const k of [].concat(keys)) {
      changes[k] = { oldValue: clone(data[k]) }
      delete data[k]
    }
    persist()
    onChanged.fns.forEach((f) => f(changes, 'local'))
  },
}

const site = params.get('site') || 'https://www.example.com/signup'
const fieldCount = Number(params.get('fields') ?? 12)
const activeTab = { id: 1, url: site, active: true, title: 'Example' }

// Fake content-script answers for messages the background forwards to the tab.
function contentResponse(msg) {
  switch (msg?.type) {
    case 'AUTOFILL':
      if (!fieldCount) return { ok: true, filled: 0 }
      return msg.preview && params.get('fill') !== 'instant' ? { ok: true, preview: true, count: fieldCount } : { ok: true, filled: fieldCount }
    case 'UNDO_FILL':
      return { ok: true, restored: fieldCount }
    default:
      return { ok: true }
  }
}

let markReady
const ready = new Promise((r) => (markReady = r))
const noop = () => Promise.resolve()

globalThis.chrome = {
  storage: { local, onChanged },
  runtime: {
    id: 'dev-preview',
    getURL: (p) => '/' + String(p).replace(/^\//, ''),
    openOptionsPage: () => window.open('/options.html', '_blank'),
    onMessage,
    onInstalled: event(),
    async sendMessage(msg) {
      await ready
      const sender = { tab: activeTab }
      for (const fn of onMessage.fns) {
        let respond
        const answered = new Promise((r) => (respond = r))
        const keepOpen = fn(msg, sender, respond)
        if (keepOpen === true) return answered
      }
      return undefined
    },
  },
  tabs: {
    query: async () => [activeTab],
    sendMessage: async (_tabId, msg) => {
      await new Promise((r) => setTimeout(r, 250)) // feel of a real round trip
      return contentResponse(msg)
    },
    create: ({ url }) => window.open(url, '_blank'),
  },
  action: { setBadgeText: noop, setBadgeBackgroundColor: noop },
  contextMenus: { create: () => {}, removeAll: (cb) => cb?.(), onClicked: event() },
  commands: { onCommand: event() },
}

// The popup closes itself after starting a preview; keep the dev tab open instead.
window.close = () => console.info('[SmartFill dev] window.close() ignored')

// Load the real background script so pages hit the real message handlers.
import('../background.js')
  .then(() => {
    // Report the field count the way the content script would.
    chrome.runtime.sendMessage({ type: 'FIELD_COUNT', count: fieldCount }).catch(() => {})
  })
  .finally(markReady)

console.info('[SmartFill dev] chrome.* mocked. Active tab:', site)
