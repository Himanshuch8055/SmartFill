// Background service worker (MV3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('SmartFill installed')
})

import {
  getProfile,
  getRules,
  saveRules,
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const profile = message.profile || (await getProfile())
        const rules = await getRules()
        if (tab?.id) {
          try {
            const result = await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL', profile, rules })
            sendResponse(result || { ok: true })
          } catch (e) {
            sendResponse({ ok: false, error: e?.message })
          }
        } else {
          sendResponse({ ok: false, error: 'No active tab' })
        }
        break
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type' })
    }
  })()
  return true // keep message channel open for async
})
