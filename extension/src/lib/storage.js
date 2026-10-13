// Storage helpers with multi-profile support. Also exports legacy getProfile/saveProfile wrappers.

import { LOCK_KEY, LockedError, getKey, isLockEnabled, encryptJSON, decryptJSON, isEncrypted, enableLock, disableLock, changePin, resetLock } from './vault'

export const SCHEMA_VERSION = 3

export const DEFAULT_PROFILE_DATA = {
  fullName: '',
  firstName: '',
  middleName: '',
  lastName: '',
  username: '',
  dob: '',
  gender: '',
  email: '',
  phone: '',
  phone2: '',
  company: '',
  jobTitle: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  website: '',
  linkedin: '',
  github: '',
  portfolio: '',
  yearsExperience: '',
  currentCtc: '',
  expectedCtc: '',
  noticePeriod: '',
  bio: '',
  school: '',
  degree: '',
  fieldOfStudy: '',
  graduationYear: '',
  // Screening questions: [{ question, answer }], matched to form questions by wording
  answers: [],
  // Resume metadata only ({ name, type, size }); the file itself is stored under resume:<profileId>
  resume: null,
  customFields: []
}

function genId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// Adds any new default keys to stored profiles without touching existing values.
export function migrateProfiles(profiles) {
  return profiles.map((p) => ({ ...p, data: { ...DEFAULT_PROFILE_DATA, ...(p.data || {}) } }))
}

// ---------- PIN lock: protected values ----------
// Profiles and resume files are stored encrypted while the PIN lock is on (see vault.js).

async function openValue(value) {
  if (!isEncrypted(value)) return value
  const key = await getKey()
  if (!key) throw new LockedError()
  return decryptJSON(key, value)
}

async function sealValue(value) {
  const key = await getKey()
  if (key) return encryptJSON(key, value)
  if (await isLockEnabled()) throw new LockedError()
  return value
}

// Writes to storage, encrypting profiles and resume files when the lock is on.
async function writeStore(obj) {
  const out = { ...obj }
  for (const k of Object.keys(out)) {
    if ((k === 'profiles' || k.startsWith('resume:')) && out[k] != null) out[k] = await sealValue(out[k])
  }
  await chrome.storage.local.set(out)
}

// Re-saves all protected data with `key` (null = plain) together with the new lock settings.
async function rewriteProtected(key, lock) {
  const { profiles } = await ensureProfiles()
  const resumes = await getResumes(profiles.map((p) => p.id))
  const out = { profiles: key ? await encryptJSON(key, profiles) : profiles }
  for (const [id, r] of Object.entries(resumes)) out[resumeKey(id)] = key ? await encryptJSON(key, r) : r
  if (lock) out[LOCK_KEY] = lock
  await chrome.storage.local.set(out)
  if (!lock) await chrome.storage.local.remove(LOCK_KEY)
}

export const setPin = (pin, options) => enableLock(pin, rewriteProtected, options)
export const removePin = (pin) => disableLock(pin, rewriteProtected)
export const updatePin = (oldPin, newPin) => changePin(oldPin, newPin, rewriteProtected)

// Forgotten PIN: delete profiles and resumes (settings, rules and snippets stay).
export async function resetAfterForgottenPin() {
  await resetLock(async () => {
    const all = await chrome.storage.local.get(null)
    await chrome.storage.local.remove(['profiles', 'activeProfileId', 'siteProfiles', ...Object.keys(all).filter((k) => k.startsWith('resume:'))])
  })
}

async function ensureProfiles() {
  const { profiles: stored, activeProfileId, profile: legacy, schemaVersion } = await chrome.storage.local.get([
    'profiles',
    'activeProfileId',
    'profile',
    'schemaVersion'
  ])
  const profiles = await openValue(stored)
  if (Array.isArray(profiles) && profiles.length) {
    if ((schemaVersion || 1) < SCHEMA_VERSION) {
      const migrated = migrateProfiles(profiles)
      await writeStore({ profiles: migrated, schemaVersion: SCHEMA_VERSION })
      return { profiles: migrated, activeProfileId: activeProfileId || migrated[0].id }
    }
    return { profiles, activeProfileId: activeProfileId || profiles[0].id }
  }
  // migrate legacy single profile if present
  const data = legacy || DEFAULT_PROFILE_DATA
  const id = genId()
  const migrated = [{ id, name: 'Default', data: { ...DEFAULT_PROFILE_DATA, ...data } }]
  await writeStore({ profiles: migrated, activeProfileId: id, schemaVersion: SCHEMA_VERSION })
  return { profiles: migrated, activeProfileId: id }
}

export async function getProfiles() {
  const { profiles } = await ensureProfiles()
  return profiles
}

export async function saveProfiles(nextProfiles, nextActiveId) {
  const payload = { profiles: nextProfiles }
  if (nextActiveId) payload.activeProfileId = nextActiveId
  await writeStore(payload)
}

export async function getActiveProfile() {
  const { profiles, activeProfileId } = await ensureProfiles()
  const found = profiles.find((p) => p.id === activeProfileId)
  return found || profiles[0]
}

export async function setActiveProfile(id) {
  await ensureProfiles()
  await chrome.storage.local.set({ activeProfileId: id })
}

export async function createProfile(name = 'New Profile', data = DEFAULT_PROFILE_DATA) {
  const { profiles } = await ensureProfiles()
  const id = genId()
  const next = [...profiles, { id, name, data: { ...DEFAULT_PROFILE_DATA, ...data } }]
  await writeStore({ profiles: next, activeProfileId: id })
  return id
}

export async function updateProfile(id, dataPatch) {
  const { profiles, activeProfileId } = await ensureProfiles()
  const next = profiles.map((p) => (p.id === id ? { ...p, data: { ...p.data, ...dataPatch } } : p))
  await saveProfiles(next, activeProfileId)
}

export async function renameProfile(id, name) {
  const { profiles, activeProfileId } = await ensureProfiles()
  const next = profiles.map((p) => (p.id === id ? { ...p, name: String(name || p.name) } : p))
  await saveProfiles(next, activeProfileId)
}

export async function deleteProfile(id) {
  const { profiles, activeProfileId } = await ensureProfiles()
  const next = profiles.filter((p) => p.id !== id)
  const nextActive = activeProfileId === id && next.length ? next[0].id : activeProfileId
  await saveProfiles(next, nextActive)
  await chrome.storage.local.remove(resumeKey(id))
  const siteProfiles = await getSiteProfiles()
  const cleaned = Object.fromEntries(Object.entries(siteProfiles).filter(([, pid]) => pid !== id))
  if (Object.keys(cleaned).length !== Object.keys(siteProfiles).length) await chrome.storage.local.set({ siteProfiles: cleaned })
}

export async function duplicateProfile(id) {
  const { profiles } = await ensureProfiles()
  const src = profiles.find((p) => p.id === id)
  if (!src) return null
  const copyId = genId()
  const copy = { id: copyId, name: `${src.name} Copy`, data: { ...src.data } }
  const resume = await getResume(id)
  await writeStore({ profiles: [...profiles, copy], activeProfileId: copyId, ...(resume ? { [resumeKey(copyId)]: resume } : {}) })
  return copyId
}

// Settings included in backups (profiles and rules are handled separately).
const BACKUP_SETTING_KEYS = ['widgetEnabled', 'fillMode', 'continueFill', 'popupProfileIds', 'snippets', 'snippetsEnabled', 'historyEnabled', 'testDataEnabled', 'language']

// Full backup. version 2 adds rules, blocked sites, per-site profiles and settings.
export async function exportProfiles() {
  const { profiles, activeProfileId } = await ensureProfiles()
  const extra = await chrome.storage.local.get(['rules', 'blockedSites', 'siteProfiles', ...BACKUP_SETTING_KEYS])
  const settings = Object.fromEntries(BACKUP_SETTING_KEYS.filter((k) => k in extra).map((k) => [k, extra[k]]))
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    profiles,
    activeProfileId,
    rules: extra.rules || [],
    blockedSites: extra.blockedSites || [],
    siteProfiles: extra.siteProfiles || {},
    settings,
    resumes: await getResumes(profiles.map((p) => p.id)),
  }
}

// Accepts version 1 (profiles only) and version 2 (full backup) files.
export async function importProfiles(payload) {
  if (!payload || !Array.isArray(payload.profiles)) throw new Error('Invalid profiles payload')
  const sanitized = payload.profiles.map((p) => ({
    id: p.id || genId(),
    name: String(p.name || 'Imported'),
    data: { ...DEFAULT_PROFILE_DATA, ...(p.data || {}) }
  }))
  const active = sanitized.find((p) => p.id === payload.activeProfileId)?.id || sanitized[0]?.id
  const next = { profiles: sanitized, activeProfileId: active, schemaVersion: SCHEMA_VERSION }
  if (payload.version >= 2) {
    if (Array.isArray(payload.rules)) next.rules = payload.rules
    if (Array.isArray(payload.blockedSites)) next.blockedSites = payload.blockedSites.map(String)
    if (payload.siteProfiles && typeof payload.siteProfiles === 'object') {
      const ids = new Set(sanitized.map((p) => p.id))
      next.siteProfiles = Object.fromEntries(Object.entries(payload.siteProfiles).filter(([, id]) => ids.has(id)))
    }
    for (const k of BACKUP_SETTING_KEYS) if (payload.settings && k in payload.settings) next[k] = payload.settings[k]
    if (payload.resumes && typeof payload.resumes === 'object') {
      for (const p of sanitized) {
        const r = payload.resumes[p.id]
        if (isValidResume(r)) next[resumeKey(p.id)] = r
      }
    }
  }
  await writeStore(next)
}

// ---------- Per-site controls ----------

export async function getBlockedSites() {
  const { blockedSites } = await chrome.storage.local.get(['blockedSites'])
  return Array.isArray(blockedSites) ? blockedSites : []
}

export async function isSiteBlocked(host) {
  return !!host && (await getBlockedSites()).includes(host)
}

export async function setSiteBlocked(host, blocked) {
  const list = (await getBlockedSites()).filter((h) => h !== host)
  if (blocked) list.push(host)
  await chrome.storage.local.set({ blockedSites: list })
}

export async function getSiteProfiles() {
  const { siteProfiles } = await chrome.storage.local.get(['siteProfiles'])
  return siteProfiles && typeof siteProfiles === 'object' ? siteProfiles : {}
}

export async function setSiteProfile(host, profileId) {
  const map = { ...(await getSiteProfiles()) }
  if (profileId) map[host] = profileId
  else delete map[host]
  await chrome.storage.local.set({ siteProfiles: map })
}

// Profile data to use on a host: the site's default profile if set, else the active one.
export async function getProfileForHost(host) {
  const siteProfiles = await getSiteProfiles()
  const id = host && siteProfiles[host]
  if (id) {
    const { profiles } = await ensureProfiles()
    const found = profiles.find((p) => p.id === id)
    if (found) return found
  }
  return getActiveProfile()
}

// Legacy wrappers for compatibility with existing code
export async function getProfile() {
  const active = await getActiveProfile()
  return active?.data || { ...DEFAULT_PROFILE_DATA }
}

export async function saveProfile(profile) {
  const active = await getActiveProfile()
  if (!active) {
    await createProfile('Default', profile)
  } else {
    await updateProfile(active.id, profile)
  }
}

// Custom rules: [{ sitePattern: string, selector?: string, labelRegex?: string, key?: string, value?: string }]
export async function getRules() {
  const { rules } = await chrome.storage.local.get(['rules'])
  return rules || []
}

export async function saveRules(rules) {
  await chrome.storage.local.set({ rules })
}

// Add or replace a rule for the same site + selector.
export async function addRule(rule) {
  const rules = await getRules()
  const next = rules.filter((r) => !(r.sitePattern === rule.sitePattern && r.selector === rule.selector))
  next.push({ ...rule, createdAt: Date.now() })
  await saveRules(next)
  return next
}

// ---------- Resumes ----------
// Stored apart from profiles so autosave doesn't resend the file on every keystroke.
// { name, type, size, dataUrl } where dataUrl is a base64 data: URL.

export const RESUME_MAX_BYTES = 2 * 1024 * 1024
export const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const resumeKey = (profileId) => `resume:${profileId}`

function isValidResume(r) {
  return !!r && typeof r.dataUrl === 'string' && r.dataUrl.startsWith('data:') && typeof r.name === 'string'
}

export async function getResume(profileId) {
  const key = resumeKey(profileId)
  const data = await chrome.storage.local.get([key])
  const r = await openValue(data[key])
  return isValidResume(r) ? r : null
}

async function getResumes(profileIds) {
  const keys = profileIds.map(resumeKey)
  const data = await chrome.storage.local.get(keys)
  const out = {}
  for (const id of profileIds) {
    const r = await openValue(data[resumeKey(id)])
    if (isValidResume(r)) out[id] = r
  }
  return out
}

// Save (or remove, with null) a profile's resume and keep the metadata in the profile in sync.
export async function setResume(profileId, resume) {
  if (resume) {
    if (!isValidResume(resume)) throw new Error('Invalid resume file')
    if (resume.size > RESUME_MAX_BYTES) throw new Error('Resume is larger than 2 MB')
    await writeStore({ [resumeKey(profileId)]: resume })
  } else {
    await chrome.storage.local.remove(resumeKey(profileId))
  }
  const meta = resume ? { name: resume.name, type: resume.type, size: resume.size } : null
  await updateProfile(profileId, { resume: meta })
}

// ---------- Fill history ----------
// A short on-device log of fills: site, profile and number of fields. Never field values or full URLs.

export const HISTORY_MAX = 200
const MERGE_MS = 10 * 60 * 1000 // later steps of the same form join the same entry

export async function getHistory() {
  const { fillHistory } = await chrome.storage.local.get(['fillHistory'])
  return Array.isArray(fillHistory) ? fillHistory : []
}

export async function addHistory({ host, profile, filled, tabId, continuation }, now = Date.now()) {
  if (!host || !filled) return
  const { historyEnabled } = await chrome.storage.local.get(['historyEnabled'])
  if (historyEnabled === false) return
  const list = await getHistory()
  const last = list[0]
  if (continuation && last && last.host === host && last.tabId === tabId && now - last.at < MERGE_MS) {
    list[0] = { ...last, filled: last.filled + filled, steps: (last.steps || 1) + 1, at: now }
  } else {
    list.unshift({ at: now, host, profile: profile || '', filled, tabId })
  }
  await chrome.storage.local.set({ fillHistory: list.slice(0, HISTORY_MAX) })
}

export async function clearHistory(host) {
  const list = host ? (await getHistory()).filter((e) => e.host !== host) : []
  await chrome.storage.local.set({ fillHistory: list })
}
