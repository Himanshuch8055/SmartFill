import { describe, it, expect, beforeEach, vi } from 'vitest'

// Minimal in-memory chrome.storage.local
let store
globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn(async (keys) => Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, store[k]]))),
      set: vi.fn(async (obj) => Object.assign(store, obj)),
    },
  },
}

const { getProfiles, getProfile, DEFAULT_PROFILE_DATA, SCHEMA_VERSION } = await import('../src/lib/storage.js')

beforeEach(() => {
  store = {}
})

describe('storage migration', () => {
  it('adds new fields to v1 profiles and keeps existing values', async () => {
    store = { profiles: [{ id: 'a', name: 'Me', data: { fullName: 'Asha', email: 'a@x.com' } }], activeProfileId: 'a' }
    const [p] = await getProfiles()
    expect(p.data.fullName).toBe('Asha')
    expect(p.data).toHaveProperty('github', '')
    expect(p.data).toHaveProperty('dob', '')
    expect(store.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('migrates the legacy single profile', async () => {
    store = { profile: { fullName: 'Old User' } }
    const data = await getProfile()
    expect(data.fullName).toBe('Old User')
    expect(Object.keys(data)).toEqual(expect.arrayContaining(Object.keys(DEFAULT_PROFILE_DATA)))
  })

  it('does not rewrite profiles already on the current schema', async () => {
    store = { profiles: [{ id: 'a', name: 'Me', data: { fullName: 'X' } }], activeProfileId: 'a', schemaVersion: SCHEMA_VERSION }
    chrome.storage.local.set.mockClear()
    await getProfiles()
    expect(chrome.storage.local.set).not.toHaveBeenCalled()
  })
})

describe('rules', () => {
  it('addRule replaces a rule with the same site and selector', async () => {
    const { addRule, getRules } = await import('../src/lib/storage.js')
    await addRule({ sitePattern: 'a.com', selector: '#x', key: 'email' })
    await addRule({ sitePattern: 'a.com', selector: '#x', key: 'phone' })
    await addRule({ sitePattern: 'b.com', selector: '#x', key: 'email' })
    const rules = await getRules()
    expect(rules.map((r) => `${r.sitePattern}:${r.key}`)).toEqual(['a.com:phone', 'b.com:email'])
  })
})

describe('per-site controls and backup', () => {
  it('blocks and unblocks a site', async () => {
    const { setSiteBlocked, isSiteBlocked } = await import('../src/lib/storage.js')
    await setSiteBlocked('a.com', true)
    expect(await isSiteBlocked('a.com')).toBe(true)
    expect(await isSiteBlocked('b.com')).toBe(false)
    await setSiteBlocked('a.com', false)
    expect(await isSiteBlocked('a.com')).toBe(false)
  })

  it('uses the site profile when set, else the active one', async () => {
    const { setSiteProfile, getProfileForHost } = await import('../src/lib/storage.js')
    store = {
      profiles: [{ id: 'w', name: 'Work', data: {} }, { id: 'p', name: 'Personal', data: {} }],
      activeProfileId: 'p',
      schemaVersion: SCHEMA_VERSION,
    }
    await setSiteProfile('corp.com', 'w')
    expect((await getProfileForHost('corp.com')).id).toBe('w')
    expect((await getProfileForHost('shop.com')).id).toBe('p')
  })

  it('deleting a profile removes its site mappings', async () => {
    const { setSiteProfile, deleteProfile, getSiteProfiles } = await import('../src/lib/storage.js')
    store = {
      profiles: [{ id: 'w', name: 'Work', data: {} }, { id: 'p', name: 'Personal', data: {} }],
      activeProfileId: 'p',
      schemaVersion: SCHEMA_VERSION,
    }
    await setSiteProfile('corp.com', 'w')
    await deleteProfile('w')
    expect(await getSiteProfiles()).toEqual({})
  })

  it('round-trips a full v2 backup', async () => {
    const { exportProfiles, importProfiles } = await import('../src/lib/storage.js')
    store = {
      profiles: [{ id: 'w', name: 'Work', data: { email: 'w@x.com' } }],
      activeProfileId: 'w',
      schemaVersion: SCHEMA_VERSION,
      rules: [{ sitePattern: 'a.com', selector: '#e', key: 'email' }],
      blockedSites: ['bank.com'],
      siteProfiles: { 'corp.com': 'w' },
      fillMode: 'instant',
    }
    const backup = await exportProfiles()
    expect(backup.version).toBe(2)
    store = {}
    await importProfiles(JSON.parse(JSON.stringify(backup)))
    expect(store.profiles[0].data.email).toBe('w@x.com')
    expect(store.rules).toHaveLength(1)
    expect(store.blockedSites).toEqual(['bank.com'])
    expect(store.siteProfiles).toEqual({ 'corp.com': 'w' })
    expect(store.fillMode).toBe('instant')
  })

  it('imports a v1 backup without touching rules or settings', async () => {
    const { importProfiles } = await import('../src/lib/storage.js')
    store = { rules: [{ sitePattern: 'keep.com', selector: '#a', key: 'email' }], fillMode: 'instant' }
    await importProfiles({ version: 1, profiles: [{ id: 'x', name: 'Old', data: { fullName: 'Old' } }], activeProfileId: 'x' })
    expect(store.profiles[0].data.fullName).toBe('Old')
    expect(store.rules).toHaveLength(1)
    expect(store.fillMode).toBe('instant')
  })
})
