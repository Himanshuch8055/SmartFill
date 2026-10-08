// Storage helpers with multi-profile support. Also exports legacy getProfile/saveProfile wrappers.

export const SCHEMA_VERSION = 2

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

async function ensureProfiles() {
  const { profiles, activeProfileId, profile: legacy, schemaVersion } = await chrome.storage.local.get([
    'profiles',
    'activeProfileId',
    'profile',
    'schemaVersion'
  ])
  if (Array.isArray(profiles) && profiles.length) {
    if ((schemaVersion || 1) < SCHEMA_VERSION) {
      const migrated = migrateProfiles(profiles)
      await chrome.storage.local.set({ profiles: migrated, schemaVersion: SCHEMA_VERSION })
      return { profiles: migrated, activeProfileId: activeProfileId || migrated[0].id }
    }
    return { profiles, activeProfileId: activeProfileId || profiles[0].id }
  }
  // migrate legacy single profile if present
  const data = legacy || DEFAULT_PROFILE_DATA
  const id = genId()
  const migrated = [{ id, name: 'Default', data: { ...DEFAULT_PROFILE_DATA, ...data } }]
  await chrome.storage.local.set({ profiles: migrated, activeProfileId: id, schemaVersion: SCHEMA_VERSION })
  return { profiles: migrated, activeProfileId: id }
}

export async function getProfiles() {
  const { profiles } = await ensureProfiles()
  return profiles
}

export async function saveProfiles(nextProfiles, nextActiveId) {
  const payload = { profiles: nextProfiles }
  if (nextActiveId) payload.activeProfileId = nextActiveId
  await chrome.storage.local.set(payload)
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
  await chrome.storage.local.set({ profiles: next, activeProfileId: id })
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
}

export async function duplicateProfile(id) {
  const { profiles } = await ensureProfiles()
  const src = profiles.find((p) => p.id === id)
  if (!src) return null
  const copyId = genId()
  const copy = { id: copyId, name: `${src.name} Copy`, data: { ...src.data } }
  await chrome.storage.local.set({ profiles: [...profiles, copy], activeProfileId: copyId })
  return copyId
}

export async function exportProfiles() {
  const { profiles, activeProfileId } = await ensureProfiles()
  return { profiles, activeProfileId, version: 1 }
}

export async function importProfiles(payload) {
  if (!payload || !Array.isArray(payload.profiles)) throw new Error('Invalid profiles payload')
  const sanitized = payload.profiles.map((p) => ({
    id: p.id || genId(),
    name: String(p.name || 'Imported'),
    data: { ...DEFAULT_PROFILE_DATA, ...(p.data || {}) }
  }))
  const active = sanitized.find((p) => p.id === payload.activeProfileId)?.id || sanitized[0]?.id
  await chrome.storage.local.set({ profiles: sanitized, activeProfileId: active })
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
