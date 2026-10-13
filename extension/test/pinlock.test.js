const work = async () => (await getProfiles()).find((p) => p.name === 'Work')
import { describe, it, expect, beforeEach } from 'vitest'
import { getProfiles, createProfile, updateProfile, setResume, getResume, exportProfiles, setPin, removePin, updatePin, resetAfterForgottenPin } from '../src/lib/storage.js'
import { unlock, lockNow, isLocked, isLockEnabled, setAutoLock, MAX_ATTEMPTS } from '../src/lib/vault.js'

function area() {
  let data = {}
  return {
    get: async (keys) => {
      if (keys == null) return { ...data }
      const list = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys)
      return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, structuredClone(data[k])]))
    },
    set: async (obj) => { data = { ...data, ...structuredClone(obj) } },
    remove: async (keys) => { for (const k of [].concat(keys)) delete data[k] },
    _raw: () => data,
  }
}

const PDF = { name: 'cv.pdf', type: 'application/pdf', size: 10, dataUrl: 'data:application/pdf;base64,JVBERi0=' }

beforeEach(async () => {
  globalThis.chrome = { storage: { local: area(), session: area() } }
  const id = await createProfile('Work', { email: 'asha@example.com' })
  await setResume(id, PDF)
})

describe('PIN lock', () => {
  it('stores profiles and resumes only encrypted, and fills them in again after unlocking', async () => {
    await setPin('2468')
    const raw = JSON.stringify(chrome.storage.local._raw())
    expect(raw).not.toContain('asha@example.com')
    expect(raw).not.toContain('JVBERi0')

    // Still unlocked right after setting the PIN.
    expect((await work()).data.email).toBe('asha@example.com')

    await lockNow()
    expect(await isLocked()).toBe(true)
    await expect(getProfiles()).rejects.toMatchObject({ code: 'LOCKED' })
    await expect(exportProfiles()).rejects.toMatchObject({ code: 'LOCKED' })

    expect(await unlock('1111')).toEqual({ ok: false, reason: 'wrong' })
    expect(await unlock('2468')).toEqual({ ok: true })
    const p = await work()
    expect(p.data.email).toBe('asha@example.com')
    expect((await getResume(p.id)).dataUrl).toBe(PDF.dataUrl)

    // Changes made while unlocked stay encrypted.
    await updateProfile(p.id, { phone: '+91 90000 11111' })
    expect(JSON.stringify(chrome.storage.local._raw())).not.toContain('90000')
  }, 30000)

  it('makes you wait after too many wrong PINs', async () => {
    await setPin('2468')
    await lockNow()
    for (let i = 0; i < MAX_ATTEMPTS; i++) await unlock('0000')
    expect(await unlock('2468')).toMatchObject({ ok: false, reason: 'wait' })
  }, 60000)

  it('changes and removes the PIN', async () => {
    await setPin('2468')
    expect(await updatePin('9999', '1357')).toMatchObject({ ok: false })
    expect(await updatePin('2468', '1357')).toEqual({ ok: true })
    await lockNow()
    expect((await unlock('2468')).ok).toBe(false)
    expect((await unlock('1357')).ok).toBe(true)
    expect(await removePin('1357')).toEqual({ ok: true })
    expect(await isLockEnabled()).toBe(false)
    expect(JSON.stringify(chrome.storage.local._raw())).toContain('asha@example.com')
    expect((await work()).data.email).toBe('asha@example.com')
  }, 60000)

  it('resets after a forgotten PIN: protected data goes, settings stay', async () => {
    await chrome.storage.local.set({ fillMode: 'instant', snippets: [{ trigger: ';a', text: 'x' }] })
    await setPin('2468')
    await lockNow()
    await resetAfterForgottenPin()
    expect(await isLockEnabled()).toBe(false)
    const profiles = await getProfiles() // a fresh empty profile
    expect(profiles.map((p) => p.data.email)).toEqual([''])
    const { fillMode, snippets } = await chrome.storage.local.get(['fillMode', 'snippets'])
    expect(fillMode).toBe('instant')
    expect(snippets).toBeUndefined() // snippets were encrypted with the forgotten PIN
  }, 30000)

  it('locks again after the auto-lock time without use', async () => {
    await setPin('2468')
    await setAutoLock(15)
    const s = await chrome.storage.session.get(['vaultKey'])
    await chrome.storage.session.set({ vaultKey: { ...s.vaultKey, lastUsed: Date.now() - 16 * 60_000 } })
    expect(await isLocked()).toBe(true)
  }, 30000)
})

describe('PIN lock hardening', () => {
  it('encrypts snippets and hides them while locked', async () => {
    const { saveSnippets, getSnippets } = await import('../src/lib/storage.js')
    await saveSnippets([{ trigger: ';addr', text: '12 MG Road, Pune' }])
    await setPin('2468')
    expect(JSON.stringify(chrome.storage.local._raw())).not.toContain('MG Road')
    await lockNow()
    await expect(getSnippets()).rejects.toMatchObject({ code: 'LOCKED' })
    await unlock('2468')
    expect((await getSnippets())[0].text).toBe('12 MG Road, Pune')
  }, 30000)

  it('never deletes a resume while locked', async () => {
    await setPin('2468')
    const id = (await work()).id
    await lockNow()
    await expect(setResume(id, null)).rejects.toMatchObject({ code: 'LOCKED' })
    await unlock('2468')
    expect((await getResume(id)).name).toBe('cv.pdf')
  }, 30000)

  it('keeps data readable when it is changed during a PIN change', async () => {
    await setPin('2468')
    const id = (await work()).id
    await Promise.all([updatePin('2468', '1357'), updateProfile(id, { city: 'Pune' })])
    await lockNow()
    await unlock('1357')
    expect((await work()).data.email).toBe('asha@example.com')
    expect((await getResume(id)).name).toBe('cv.pdf')
  }, 60000)
})
