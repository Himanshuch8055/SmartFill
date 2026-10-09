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
  getProfileForHost
} from './lib/storage'
import { PROFILE_FIELDS } from './lib/profileFields'

chrome.runtime.onInstalled.addListener(({ reason }) => {
  createContextMenus()
  if (reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })
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

// preview: true/false forces a mode; undefined uses the user's setting (default: preview)
async function autofillTab(tab, { preview, profile } = {}) {
  const host = hostOf(tab.url)
  if (await isSiteBlocked(host)) return { ok: false, error: `SmartFill is turned off on ${host}` }
  const { fillMode } = await chrome.storage.local.get(['fillMode'])
  const usePreview = preview ?? fillMode !== 'instant'
  const data = profile || (await getProfileForHost(host))?.data || (await getProfile())
  const rules = await getRules()
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL', profile: data, rules, preview: usePreview })
    return res || { ok: true }
  } catch (e) {
    return { ok: false, error: 'SmartFill cannot run on this page. Try reloading it.' }
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
  if (tabId) chrome.tabs.sendMessage(tabId, { type: 'TOAST', text: `SmartFill profile: ${next.name}` }).catch(() => {})
}

// ---------- Keyboard shortcuts ----------

chrome.commands?.onCommand.addListener(async (command) => {
  const tab = await getActiveTab()
  if (!tab?.id) return
  if (command === 'fill-form') await autofillTab(tab)
  else if (command === 'undo-fill') await undoTab(tab.id)
  else if (command === 'next-profile') await cycleProfile(tab.id)
})

// ---------- Context menu ----------

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'sf-fill', title: 'SmartFill: Fill this form', contexts: ['page', 'editable'] })
    chrome.contextMenus.create({ id: 'sf-field', title: 'Fill this field with', contexts: ['editable'] })
    for (const f of PROFILE_FIELDS) {
      chrome.contextMenus.create({ id: `sf-field:${f.name}`, parentId: 'sf-field', title: f.label, contexts: ['editable'] })
    }
    chrome.contextMenus.create({ id: 'sf-undo', title: 'SmartFill: Undo last fill', contexts: ['page', 'editable'] })
    chrome.contextMenus.create({ id: 'sf-toggle-site', title: 'SmartFill: Turn on/off for this site', contexts: ['page', 'editable'] })
  })
}

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  const id = String(info.menuItemId)
  const host = hostOf(tab.url)
  if (id === 'sf-toggle-site') {
    const blocked = !(await isSiteBlocked(host))
    await setSiteBlocked(host, blocked)
    const text = blocked ? `SmartFill turned off on ${host}` : `SmartFill turned on for ${host}`
    chrome.tabs.sendMessage(tab.id, { type: 'TOAST', text, force: true }).catch(() => {})
    return
  }
  if (await isSiteBlocked(host)) return
  if (id === 'sf-fill') {
    await autofillTab(tab)
  } else if (id === 'sf-undo') {
    await undoTab(tab.id)
  } else if (id.startsWith('sf-field:')) {
    const key = id.slice('sf-field:'.length)
    const profile = (await getProfileForHost(host))?.data || (await getProfile())
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
    switch (message?.type) {
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
          sendResponse({ ok: false, error: 'No active tab' })
          break
        }
        sendResponse(await autofillTab(tab, { preview: message.preview, profile: message.profile }))
        break
      }
      case 'UNDO_ACTIVE': {
        const tab = await getActiveTab()
        sendResponse(tab?.id ? await undoTab(tab.id) : { ok: false, error: 'No active tab' })
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
      case 'FILL_DONE': {
        const { fillCount = 0 } = await chrome.storage.local.get(['fillCount'])
        await chrome.storage.local.set({ fillCount: fillCount + 1 })
        sendResponse({ ok: true })
        break
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type' })
    }
  })()
  return true // keep message channel open for async
})
