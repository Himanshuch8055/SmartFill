// Background service worker (MV3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('SmartFill installed')
})

import { getProfile, getRules, saveRules } from './lib/storage'

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
        await chrome.storage.local.set({ profile: message.profile })
        sendResponse({ ok: true })
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
