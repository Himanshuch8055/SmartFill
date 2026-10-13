// Optional PIN lock. When it is on, profiles and resume files are stored only encrypted
// (AES-256-GCM, key derived from the PIN with PBKDF2-SHA-256). After unlocking, the key is kept in
// chrome.storage.session: memory only, cleared when the browser closes, and not readable by pages.
//
// A short PIN keeps a profile safe from someone using the same computer; it is not strong against
// someone who copies the browser's files and guesses offline. A forgotten PIN can't be recovered.

export const PIN_MIN_LENGTH = 4
export const ITERATIONS = 600_000
export const LOCK_KEY = 'lock' // in storage.local: { v, salt, iterations, check, autoLockMinutes }
const SESSION_KEY = 'vaultKey' // in storage.session: { key, lastUsed }
const ATTEMPTS_KEY = 'vaultAttempts' // in storage.session: { count, until }
const CHECK_TEXT = 'smartfill-vault'
export const MAX_ATTEMPTS = 5
export const WAIT_MS = 30_000

const enc = new TextEncoder()
const dec = new TextDecoder()

function toB64(buf) {
  let s = ''
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b)
  return btoa(s)
}
function fromB64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

export class LockedError extends Error {
  constructor() {
    super('SmartFill is locked')
    this.code = 'LOCKED'
  }
}

async function deriveKey(pin, salt, iterations = ITERATIONS) {
  const base = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptJSON(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)))
  return { enc: 1, iv: toB64(iv), data: toB64(data) }
}

export async function decryptJSON(key, box) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.data))
  return JSON.parse(dec.decode(plain))
}

export const isEncrypted = (value) => !!value && value.enc === 1 && typeof value.iv === 'string'

// ---------- state ----------

export async function getLockConfig() {
  const { [LOCK_KEY]: lock } = await chrome.storage.local.get([LOCK_KEY])
  return lock && lock.v === 1 ? lock : null
}

export async function isLockEnabled() {
  return !!(await getLockConfig())
}

async function keepKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key)
  await chrome.storage.session.set({ [SESSION_KEY]: { key: toB64(raw), lastUsed: Date.now() } })
}

// The unlocked key, or null when locked (also locks after the auto-lock time without use).
export async function getKey() {
  const lock = await getLockConfig()
  if (!lock) return null
  const { [SESSION_KEY]: s } = await chrome.storage.session.get([SESSION_KEY])
  if (!s?.key) return null
  const idleLimit = Number(lock.autoLockMinutes) || 0
  if (idleLimit && Date.now() - s.lastUsed > idleLimit * 60_000) {
    await lockNow()
    return null
  }
  // Note the use at most once a minute to avoid constant writes.
  if (Date.now() - s.lastUsed > 60_000) await chrome.storage.session.set({ [SESSION_KEY]: { ...s, lastUsed: Date.now() } })
  return crypto.subtle.importKey('raw', fromB64(s.key), 'AES-GCM', true, ['encrypt', 'decrypt'])
}

export async function isLocked() {
  return (await isLockEnabled()) && !(await getKey())
}

export async function lockNow() {
  await chrome.storage.session.remove(SESSION_KEY)
}

// Too many wrong PINs: wait a little before the next try.
export async function attemptsWait() {
  const { [ATTEMPTS_KEY]: a } = await chrome.storage.session.get([ATTEMPTS_KEY])
  return a?.until && a.until > Date.now() ? a.until - Date.now() : 0
}

async function recordAttempt(ok) {
  if (ok) return chrome.storage.session.remove(ATTEMPTS_KEY)
  const { [ATTEMPTS_KEY]: a = { count: 0 } } = await chrome.storage.session.get([ATTEMPTS_KEY])
  const count = (a.count || 0) + 1
  await chrome.storage.session.set({ [ATTEMPTS_KEY]: { count: count >= MAX_ATTEMPTS ? 0 : count, until: count >= MAX_ATTEMPTS ? Date.now() + WAIT_MS : 0 } })
}

async function keyFromPin(pin, lock) {
  const key = await deriveKey(pin, fromB64(lock.salt), lock.iterations || ITERATIONS)
  try {
    return (await decryptJSON(key, lock.check)) === CHECK_TEXT ? key : null
  } catch {
    return null // wrong PIN: authentication fails
  }
}

// Returns { ok } or { ok: false, reason: 'wrong' | 'wait', waitMs }
export async function unlock(pin) {
  const lock = await getLockConfig()
  if (!lock) return { ok: true }
  const waitMs = await attemptsWait()
  if (waitMs) return { ok: false, reason: 'wait', waitMs }
  const key = await keyFromPin(pin, lock)
  await recordAttempt(!!key)
  if (!key) return { ok: false, reason: 'wrong' }
  await keepKey(key)
  return { ok: true }
}

// ---------- turning it on and off ----------
// `rewrite(key, lock)` re-saves the protected data with `key` (null = plain text) in the same storage
// write as the new lock settings (null = remove them), so a crash can never leave data encrypted with
// a key the settings don't describe. storage.js passes it; this module doesn't know what is protected.

export async function enableLock(pin, rewrite, { autoLockMinutes = 0 } = {}) {
  if (String(pin).length < PIN_MIN_LENGTH) throw new Error('PIN too short')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(pin, salt)
  const lock = { v: 1, salt: toB64(salt), iterations: ITERATIONS, check: await encryptJSON(key, CHECK_TEXT), autoLockMinutes }
  await rewrite(key, lock)
  await keepKey(key)
}

export async function disableLock(pin, rewrite) {
  const lock = await getLockConfig()
  if (!lock) return { ok: true }
  const res = await unlock(pin)
  if (!res.ok) return res
  await rewrite(null, null)
  await lockNow()
  return { ok: true }
}

export async function changePin(oldPin, newPin, rewrite) {
  const lock = await getLockConfig()
  const res = await unlock(oldPin)
  if (!res.ok) return res
  await enableLock(newPin, rewrite, { autoLockMinutes: lock?.autoLockMinutes || 0 })
  return { ok: true }
}

export async function setAutoLock(minutes) {
  const lock = await getLockConfig()
  if (lock) await chrome.storage.local.set({ [LOCK_KEY]: { ...lock, autoLockMinutes: Number(minutes) || 0 } })
}

// Forgotten PIN: remove the lock and the data it protects. `wipe()` deletes that data.
export async function resetLock(wipe) {
  await wipe()
  await chrome.storage.local.remove(LOCK_KEY)
  await chrome.storage.session.remove([SESSION_KEY, ATTEMPTS_KEY])
}
