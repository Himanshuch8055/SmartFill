// Background service worker (MV3)
import {
  getProfile,
  getRules,
  saveRules,
  addRule,
  getProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  duplicateProfile,
  exportProfiles,
  importProfiles,
  renameProfile,
  isSiteBlocked,
  setSiteBlocked,
  getSiteProfiles,
  setSiteProfile,
  getProfileForHost,
  addHistory,
  clearHistory,
  getResume,
  setPin,
  removePin,
  updatePin,
  resetAfterForgottenPin,
  getAiKey,
  setAiKey,
  setResume
} from './lib/storage'
import { makeTestProfile } from './lib/testData'
import { draftAnswer, AI_ORIGIN, DEFAULT_MODEL } from './lib/ai'
import { unlock, lockNow, isLocked, isLockEnabled, getLockConfig, setAutoLock, attemptsWait } from './lib/vault'

const lockedMessage = () => t('SmartFill is locked. Click the SmartFill icon in the toolbar and enter your PIN.')
const lockedReply = () => ({ ok: false, locked: true, error: lockedMessage() })
import { PROFILE_FIELDS } from './lib/profileFields'
import { GOODBYE_URL } from './lib/links'
import { t, initLanguage } from './lib/i18n'

initLanguage()

// Short "why did you uninstall?" page. Only the version is passed; nothing is collected.
try {
  chrome.runtime.setUninstallURL?.(`${GOODBYE_URL}?v=${chrome.runtime.getManifest().version}`)
} catch {}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  createContextMenus()
  if (reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })
})

// The "Fill with test data" menu item follows the developer setting; titles follow the language.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ('testDataEnabled' in changes || 'aiEnabled' in changes || 'language' in changes)) createContextMenus()
})

// ---------- Fill helpers ----------

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

// ---------- Multi-page fill sessions ----------
// After a fill, a tab stays in a session for SESSION_MS so the next steps of the same form
// (new fields, or a new page on the same site) can be filled too.

const SESSION_MS = 10 * 60 * 1000
const sessionKey = (tabId) => `fillSession:${tabId}`

// Same site: identical hosts, or sharing the last two labels (jobs.acme.com / apply.acme.com).
function sameSite(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  const base = (h) => h.split('.').slice(-2).join('.')
  return base(a) === base(b)
}

async function getSession(tabId) {
  try {
    const data = await chrome.storage.session.get(sessionKey(tabId))
    const s = data[sessionKey(tabId)]
    return s && s.expires > Date.now() ? s : null
  } catch {
    return null
  }
}

async function startSession(tab) {
  if (tab?.id == null) return
  const { continueFill } = await chrome.storage.local.get(['continueFill'])
  if (continueFill === false) return
  await chrome.storage.session.set({ [sessionKey(tab.id)]: { host: hostOf(tab.url), expires: Date.now() + SESSION_MS } }).catch(() => {})
}

async function endSession(tabId) {
  await chrome.storage.session.remove(sessionKey(tabId)).catch?.(() => {})
}

chrome.tabs.onRemoved?.addListener((tabId) => {
  endSession(tabId)
  chrome.storage.session.remove([`fillProfile:${tabId}`, `testProfile:${tabId}`]).catch?.(() => {})
})

// preview: true/false forces a mode; undefined uses the user's setting (default: preview)
// continuation: this is a later step of a form already filled in this tab
async function autofillTab(tab, options = {}) {
  try {
    return await autofillTabUnlocked(tab, options)
  } catch (e) {
    if (e?.code !== 'LOCKED') throw e
    // Shortcuts and the right-click menu have no popup to show this in: say it on the page.
    chrome.tabs.sendMessage(tab.id, { type: 'TOAST', text: lockedMessage() }).catch(() => {})
    return lockedReply()
  }
}

async function autofillTabUnlocked(tab, { preview, profile, continuation = false, testData = false } = {}) {
  const host = hostOf(tab.url)
  if (await isSiteBlocked(host)) return { ok: false, error: t('SmartFill is turned off on {host}', { host }) }
  // Test data: a new made-up person per fill, kept for the next steps of the same form.
  const testKey = `testProfile:${tab.id}`
  if (testData) {
    profile = makeTestProfile()
    await chrome.storage.session.set({ [testKey]: profile }).catch(() => {})
  } else if (continuation && !profile) {
    profile = (await chrome.storage.session.get(testKey).catch(() => ({})))[testKey]
    testData = !!profile
  } else {
    await chrome.storage.session.remove(testKey).catch?.(() => {})
  }
  const { fillMode } = await chrome.storage.local.get(['fillMode'])
  const usePreview = preview ?? fillMode !== 'instant'
  const siteProfile = profile ? null : (await getProfileForHost(host))
  const data = profile || siteProfile?.data || (await getProfile())
  // Remembered so the fill history can name the profile once the page reports what it filled.
  await chrome.storage.session.set({ [`fillProfile:${tab.id}`]: testData ? 'Test data' : profile ? '' : siteProfile?.name || '' }).catch(() => {})
  const rules = await getRules()
  // The resume is sent only when this profile has one and the page is filled.
  const resume = siteProfile?.id && data?.resume ? await getResume(siteProfile.id) : null
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL', profile: data, rules, resume, preview: usePreview, continuation })
    return res || { ok: true }
  } catch (e) {
    return { ok: false, error: t('SmartFill cannot run on this page. Try reloading it.') }
  }
}

async function undoTab(tabId) {
  try {
    return (await chrome.tabs.sendMessage(tabId, { type: 'UNDO_FILL' })) || { ok: true }
  } catch (e) {
    return { ok: false, error: e?.message }
  }
}

async function cycleProfile(tabId) {
  const profiles = await getProfiles()
  if (profiles.length < 2) return
  const active = await getActiveProfile()
  const idx = profiles.findIndex((p) => p.id === active?.id)
  const next = profiles[(idx + 1) % profiles.length]
  await setActiveProfile(next.id)
  if (tabId) chrome.tabs.sendMessage(tabId, { type: 'TOAST', text: t('SmartFill profile: {name}', { name: next.name }) }).catch(() => {})
}

// ---------- Keyboard shortcuts ----------

chrome.commands?.onCommand.addListener(async (command) => {
  const tab = await getActiveTab()
  if (!tab?.id) return
  if (command === 'fill-form') await autofillTab(tab)
  else if (command === 'undo-fill') await undoTab(tab.id)
  else if (command === 'next-profile') await cycleProfile(tab.id).catch((e) => showLockedOnPage(e, tab))
})

function showLockedOnPage(e, tab) {
  if (e?.code !== 'LOCKED') throw e
  chrome.tabs.sendMessage(tab.id, { type: 'TOAST', text: lockedMessage() }).catch(() => {})
}

// ---------- Context menu ----------

let testDataMenu = false
let aiMenu = false

async function aiSettings() {
  const { aiEnabled, aiModel } = await chrome.storage.local.get(['aiEnabled', 'aiModel'])
  const permitted = await chrome.permissions?.contains({ origins: [AI_ORIGIN] }).catch(() => false)
  return { enabled: aiEnabled === true && !!permitted, model: aiModel || DEFAULT_MODEL }
}

// Loads the language first, so it also picks up a language change.
async function createContextMenus() {
  await initLanguage()
  testDataMenu = (await chrome.storage.local.get(['testDataEnabled'])).testDataEnabled === true
  aiMenu = (await aiSettings()).enabled
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'sf-fill', title: t('SmartFill: Fill this form'), contexts: ['page', 'editable'] })
    chrome.contextMenus.create({ id: 'sf-field', title: t('Fill this field with'), contexts: ['editable'] })
    for (const f of PROFILE_FIELDS) {
      chrome.contextMenus.create({ id: `sf-field:${f.name}`, parentId: 'sf-field', title: t(f.label), contexts: ['editable'] })
    }
    if (aiMenu) chrome.contextMenus.create({ id: 'sf-ai', title: t('SmartFill: Draft an answer with AI'), contexts: ['editable'] })
    if (testDataMenu) chrome.contextMenus.create({ id: 'sf-test', title: t('SmartFill: Fill with test data'), contexts: ['page', 'editable'] })
    chrome.contextMenus.create({ id: 'sf-undo', title: t('SmartFill: Undo last fill'), contexts: ['page', 'editable'] })
    chrome.contextMenus.create({ id: 'sf-toggle-site', title: t('SmartFill: Turn on/off for this site'), contexts: ['page', 'editable'] })
  })
}

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  const id = String(info.menuItemId)
  const host = hostOf(tab.url)
  if (id === 'sf-toggle-site') {
    const blocked = !(await isSiteBlocked(host))
    await setSiteBlocked(host, blocked)
    const text = blocked ? t('SmartFill turned off on {host}', { host }) : t('SmartFill turned on for {host}', { host })
    chrome.tabs.sendMessage(tab.id, { type: 'TOAST', text, force: true }).catch(() => {})
    return
  }
  if (await isSiteBlocked(host)) return
  if (id === 'sf-fill') {
    await autofillTab(tab)
  } else if (id === 'sf-ai') {
    chrome.tabs.sendMessage(tab.id, { type: 'AI_DRAFT_FIELD' }, { frameId: info.frameId ?? 0 }).catch(() => {})
  } else if (id === 'sf-test') {
    await autofillTab(tab, { testData: true })
  } else if (id === 'sf-undo') {
    await undoTab(tab.id)
  } else if (id.startsWith('sf-field:')) {
    const key = id.slice('sf-field:'.length)
    let profile
    try {
      profile = (await getProfileForHost(host))?.data || (await getProfile())
    } catch (e) {
      return showLockedOnPage(e, tab)
    }
    chrome.tabs
      .sendMessage(tab.id, { type: 'FILL_FIELD', key, profile }, { frameId: info.frameId ?? 0 })
      .catch(() => {})
  }
})

// ---------- Per-tab field counts (for the popup) ----------
// Kept in storage.session so they survive the service worker being suspended.

const tabCounts = new Map()
const sessionStore = chrome.storage.session

async function setTabCount(tabId, count) {
  tabCounts.set(tabId, count)
  try { await sessionStore?.set({ [`count:${tabId}`]: count }) } catch {}
}

async function getTabCount(tabId) {
  if (tabCounts.has(tabId)) return tabCounts.get(tabId)
  try {
    const key = `count:${tabId}`
    const data = await sessionStore?.get(key)
    if (data && key in data) return data[key]
  } catch {}
  return null // unknown: the content script hasn't reported (e.g. page opened before install)
}

chrome.tabs.onRemoved?.addListener((tabId) => {
  tabCounts.delete(tabId)
  sessionStore?.remove(`count:${tabId}`).catch?.(() => {})
})

// Pages where browsers never run extension content scripts.
function isRestrictedUrl(url = '') {
  if (!/^https?:/i.test(url)) return true
  return /^https:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com|addons\.mozilla\.org|microsoftedge\.microsoft\.com\/addons)/i.test(url)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      await handleMessage(message, sender, sendResponse)
    } catch (e) {
      if (e?.code === 'LOCKED') sendResponse(lockedReply())
      else sendResponse({ ok: false, error: e?.message || String(e) })
    }
  })()
  return true // keep message channel open for async
})

// Messages from pages that only extension pages may send (not content scripts).
const fromExtensionPage = (sender) => !sender.tab || sender.url?.startsWith(chrome.runtime.getURL(''))

async function handleMessage(message, sender, sendResponse) {
  switch (message?.type) {
    case 'GET_LOCK_STATE': {
      const lock = await getLockConfig()
      sendResponse({ ok: true, enabled: !!lock, locked: await isLocked(), autoLockMinutes: lock?.autoLockMinutes || 0, waitMs: await attemptsWait() })
      break
    }
    case 'UNLOCK': {
      if (!fromExtensionPage(sender)) return sendResponse({ ok: false })
      sendResponse(await unlock(message.pin))
      break
    }
    case 'LOCK_NOW': {
      await lockNow()
      sendResponse({ ok: true })
      break
    }
    case 'SET_PIN': {
      if (!fromExtensionPage(sender)) return sendResponse({ ok: false })
      if (await isLockEnabled()) return sendResponse({ ok: false, error: 'A PIN is already set' })
      await setPin(String(message.pin || ''), { autoLockMinutes: Number(message.autoLockMinutes) || 0 })
      sendResponse({ ok: true })
      break
    }
    case 'CHANGE_PIN': {
      if (!fromExtensionPage(sender)) return sendResponse({ ok: false })
      sendResponse(await updatePin(String(message.oldPin || ''), String(message.newPin || '')))
      break
    }
    case 'REMOVE_PIN': {
      if (!fromExtensionPage(sender)) return sendResponse({ ok: false })
      sendResponse(await removePin(String(message.pin || '')))
      break
    }
    case 'SET_AUTO_LOCK': {
      if (await isLocked()) return sendResponse(lockedReply())
      await setAutoLock(message.minutes)
      sendResponse({ ok: true })
      break
    }
    case 'GET_AI_STATE': {
      const { enabled, model } = await aiSettings()
      const { aiEnabled } = await chrome.storage.local.get(['aiEnabled'])
      sendResponse({ ok: true, enabled, wanted: aiEnabled === true, model, hasKey: !!(await getAiKey()) })
      break
    }
    case 'SET_AI_KEY': {
      if (!fromExtensionPage(sender)) return sendResponse({ ok: false })
      await setAiKey(message.key)
      sendResponse({ ok: true })
      break
    }
    case 'TEST_AI_KEY': {
      if (!fromExtensionPage(sender)) return sendResponse({ ok: false })
      const { model } = await aiSettings()
      sendResponse(await draftAnswer({ apiKey: message.key || (await getAiKey()), model, question: 'Reply with the single word OK.', maxLength: 20 }))
      break
    }
    case 'AI_DRAFT': {
      // From the content script, after the user chose "Draft an answer with AI" on a field.
      const { enabled, model } = await aiSettings()
      if (!enabled) return sendResponse({ ok: false, error: t('Turn on AI answers in SmartFill settings first.') })
      const host = hostOf(sender.tab?.url || '')
      const profile = (await getProfileForHost(host))?.data || (await getProfile())
      sendResponse(await draftAnswer({
        apiKey: await getAiKey(),
        model,
        question: String(message.question || '').slice(0, 1000),
        pageTitle: String(message.pageTitle || '').slice(0, 200),
        pageText: String(message.pageText || ''),
        maxLength: Number(message.maxLength) || 0,
        profile,
      }))
      break
    }
    case 'RESET_FORGOTTEN_PIN': {
      if (!fromExtensionPage(sender)) return sendResponse({ ok: false })
      await resetAfterForgottenPin()
      sendResponse({ ok: true })
      break
    }
    case 'PING':
      sendResponse({ ok: true, ts: Date.now() })
      break
    case 'GET_PROFILE': {
      const profile = await getProfile()
      sendResponse({ profile })
      break
    }
    case 'SAVE_PROFILE': {
      // Update active profile's data
      const active = await getActiveProfile()
      if (active?.id) await updateProfile(active.id, message.profile || {})
      sendResponse({ ok: true })
      break
    }
    case 'GET_PROFILES': {
      const profiles = await getProfiles()
      const active = await getActiveProfile()
      sendResponse({ ok: true, profiles, activeProfileId: active?.id })
      break
    }
    case 'SET_ACTIVE_PROFILE': {
      await setActiveProfile(message.id)
      const active = await getActiveProfile()
      sendResponse({ ok: true, activeProfileId: active?.id })
      break
    }
    case 'CREATE_PROFILE': {
      const id = await createProfile(message.name, message.data)
      sendResponse({ ok: true, id })
      break
    }
    case 'UPDATE_PROFILE': {
      await updateProfile(message.id, message.data || {})
      sendResponse({ ok: true })
      break
    }
    case 'RENAME_PROFILE': {
      await renameProfile(message.id, message.name)
      sendResponse({ ok: true })
      break
    }
    case 'DELETE_PROFILE': {
      await deleteProfile(message.id)
      const active = await getActiveProfile()
      sendResponse({ ok: true, activeProfileId: active?.id })
      break
    }
    case 'DUPLICATE_PROFILE': {
      const id = await duplicateProfile(message.id)
      sendResponse({ ok: true, id })
      break
    }
    case 'EXPORT_PROFILES': {
      const payload = await exportProfiles()
      sendResponse({ ok: true, payload })
      break
    }
    case 'IMPORT_PROFILES': {
      try {
        await importProfiles(message.payload)
        const active = await getActiveProfile()
        sendResponse({ ok: true, activeProfileId: active?.id })
      } catch (e) {
        sendResponse({ ok: false, error: e?.message })
      }
      break
    }
    case 'GET_RULES': {
      const rules = await getRules()
      sendResponse({ ok: true, rules })
      break
    }
    case 'SAVE_RULES': {
      await saveRules(message.rules || [])
      sendResponse({ ok: true })
      break
    }
    case 'AUTOFILL_ACTIVE': {
      const tab = await getActiveTab()
      if (!tab?.id) {
        sendResponse({ ok: false, error: t('No active tab') })
        break
      }
      sendResponse(await autofillTab(tab, { preview: message.preview, profile: message.profile, testData: message.testData === true }))
      break
    }
    case 'UNDO_ACTIVE': {
      const tab = await getActiveTab()
      sendResponse(tab?.id ? await undoTab(tab.id) : { ok: false, error: t('No active tab') })
      break
    }
    // Everything the popup needs about the current tab in one call.
    case 'GET_TAB_STATE': {
      const tab = await getActiveTab()
      const url = tab?.url || ''
      const restricted = isRestrictedUrl(url)
      const host = restricted ? '' : hostOf(url)
      const siteProfiles = await getSiteProfiles()
      sendResponse({
        ok: true,
        host,
        restricted,
        fieldCount: tab?.id != null && !restricted ? await getTabCount(tab.id) : null,
        blocked: host ? await isSiteBlocked(host) : false,
        siteProfileId: (host && siteProfiles[host]) || '',
      })
      break
    }
    case 'GET_SITE_STATE': {
      const siteProfiles = await getSiteProfiles()
      sendResponse({ ok: true, blocked: await isSiteBlocked(message.host), siteProfileId: siteProfiles[message.host] || '' })
      break
    }
    case 'SET_SITE_BLOCKED': {
      await setSiteBlocked(message.host, !!message.blocked)
      sendResponse({ ok: true })
      break
    }
    case 'SET_SITE_PROFILE': {
      await setSiteProfile(message.host, message.profileId || '')
      sendResponse({ ok: true })
      break
    }
    // What the content script needs to count fillable fields: answers and whether a resume exists.
    case 'START_FILL_SESSION': {
      await startSession(sender.tab)
      sendResponse({ ok: true })
      break
    }
    case 'END_FILL_SESSION': {
      if (sender.tab?.id != null) await endSession(sender.tab.id)
      sendResponse({ ok: true })
      break
    }
    case 'GET_FILL_SESSION': {
      const session = sender.tab?.id != null ? await getSession(sender.tab.id) : null
      sendResponse({ ok: true, active: !!session && sameSite(session.host, hostOf(sender.tab.url)) })
      break
    }
    // The content script found new empty fields during a session: fill the next step.
    case 'CONTINUE_FILL': {
      const tab = sender.tab
      const session = tab?.id != null ? await getSession(tab.id) : null
      const { continueFill } = await chrome.storage.local.get(['continueFill'])
      if (!session || continueFill === false || !sameSite(session.host, hostOf(tab.url))) {
        sendResponse({ ok: false, inactive: true })
        break
      }
      sendResponse(await autofillTab(tab, { continuation: true }))
      break
    }
    case 'GET_FILL_CONTEXT': {
      const p = await getProfileForHost(message.host)
      sendResponse({ ok: true, answers: p?.data?.answers || [], hasResume: !!p?.data?.resume })
      break
    }
    case 'SET_RESUME': {
      try {
        await setResume(message.id, message.resume || null)
        sendResponse({ ok: true })
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || t("Couldn't save the file") })
      }
      break
    }
    case 'ADD_RULE': {
      await addRule(message.rule)
      sendResponse({ ok: true })
      break
    }
    case 'FIELD_COUNT': {
      if (sender.tab?.id) await setTabCount(sender.tab.id, message.count)
      sendResponse({ ok: true })
      break
    }
    case 'CLEAR_HISTORY': {
      await clearHistory(message.host)
      sendResponse({ ok: true })
      break
    }
    case 'FILL_DONE': {
      const { fillCount = 0 } = await chrome.storage.local.get(['fillCount'])
      await chrome.storage.local.set({ fillCount: fillCount + 1 })
      const tabId = sender.tab?.id
      const key = `fillProfile:${tabId}`
      const names = await chrome.storage.session.get(key).catch(() => ({}))
      await addHistory({ host: hostOf(sender.tab?.url || ''), profile: names[key], filled: message.filled, tabId, continuation: message.continuation })
      sendResponse({ ok: true })
      break
    }
    default:
      sendResponse({ ok: false, error: t('Unknown message type') })
  }
}
