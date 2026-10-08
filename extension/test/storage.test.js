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
