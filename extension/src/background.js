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
  renameProfile
} from './lib/storage'
import { PROFILE_FIELDS } from './lib/profileFields'

chrome.runtime.onInstalled.addListener(() => {
  console.log('SmartFill installed')
  createContextMenus()
})

// ---------- Fill helpers ----------

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

// preview: true/false forces a mode; undefined uses the user's setting (default: preview)
async function autofillTab(tabId, { preview, profile } = {}) {
  const { fillMode } = await chrome.storage.local.get(['fillMode'])
  const usePreview = preview ?? fillMode !== 'instant'
  const data = profile || (await getProfile())
  const rules = await getRules()
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'AUTOFILL', profile: data, rules, preview: usePreview })
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
  if (command === 'fill-form') await autofillTab(tab.id)
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
  })
}

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  const id = String(info.menuItemId)
  if (id === 'sf-fill') {
    await autofillTab(tab.id)
  } else if (id === 'sf-undo') {
    await undoTab(tab.id)
  } else if (id.startsWith('sf-field:')) {
    const key = id.slice('sf-field:'.length)
    const profile = await getProfile()
    chrome.tabs
      .sendMessage(tab.id, { type: 'FILL_FIELD', key, profile }, { frameId: info.frameId ?? 0 })
      .catch(() => {})
  }
})

// ---------- Toolbar badge ----------

function setBadge(tabId, count) {
  chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' }).catch(() => {})
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#2563eb' }).catch(() => {})
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
        sendResponse(await autofillTab(tab.id, { preview: message.preview, profile: message.profile }))
        break
      }
      case 'UNDO_ACTIVE': {
        const tab = await getActiveTab()
        sendResponse(tab?.id ? await undoTab(tab.id) : { ok: false, error: 'No active tab' })
        break
      }
      case 'ADD_RULE': {
        await addRule(message.rule)
        sendResponse({ ok: true })
        break
      }
      case 'FIELD_COUNT': {
        if (sender.tab?.id) setBadge(sender.tab.id, message.count)
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
