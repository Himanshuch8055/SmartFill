// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { addHistory, getHistory, clearHistory, HISTORY_MAX } from '../src/lib/storage.js'
import { filledAgo } from '../src/lib/time.js'

let store
beforeEach(() => {
  store = {}
  globalThis.chrome = {
    storage: {
      local: {
        get: async (keys) => Object.fromEntries([].concat(keys).filter((k) => k in store).map((k) => [k, store[k]])),
        set: async (obj) => Object.assign(store, obj),
      },
    },
  }
})

describe('fill history', () => {
  it('records site, profile and count only', async () => {
    await addHistory({ host: 'jobs.acme.com', profile: 'Work', filled: 5, tabId: 1 }, 1000)
    expect(await getHistory()).toEqual([{ at: 1000, host: 'jobs.acme.com', profile: 'Work', filled: 5, tabId: 1 }])
  })

  it('merges later steps of the same form into one entry', async () => {
    await addHistory({ host: 'a.com', filled: 5, tabId: 1 }, 1000)
    await addHistory({ host: 'a.com', filled: 3, tabId: 1, continuation: true }, 2000)
    await addHistory({ host: 'a.com', filled: 2, tabId: 2, continuation: true }, 3000) // other tab
    const list = await getHistory()
    expect(list).toHaveLength(2)
    expect(list[1]).toMatchObject({ filled: 8, steps: 2, at: 2000 })
  })

  it('skips empty fills, respects the setting and caps the list', async () => {
    await addHistory({ host: 'a.com', filled: 0 })
    expect(await getHistory()).toEqual([])
    store.historyEnabled = false
    await addHistory({ host: 'a.com', filled: 1 })
    expect(await getHistory()).toEqual([])
    store.historyEnabled = true
    for (let i = 0; i < HISTORY_MAX + 5; i++) await addHistory({ host: `s${i}.com`, filled: 1 }, i)
    expect((await getHistory()).length).toBe(HISTORY_MAX)
  })

  it('clears one site or everything', async () => {
    await addHistory({ host: 'a.com', filled: 1 }, 1)
    await addHistory({ host: 'b.com', filled: 1 }, 2)
    await clearHistory('a.com')
    expect((await getHistory()).map((e) => e.host)).toEqual(['b.com'])
    await clearHistory()
    expect(await getHistory()).toEqual([])
  })

  it('labels relative times', () => {
    const now = Date.UTC(2026, 9, 12, 12)
    expect(filledAgo(now - 20 * 1000, now)).toBe('Filled here just now')
    expect(filledAgo(now - 5 * 60000, now)).toBe('Filled here 5 min ago')
    expect(filledAgo(now - 3 * 3600000, now)).toBe('Filled here 3 hours ago')
    expect(filledAgo(now - 26 * 3600000, now)).toBe('Filled here yesterday')
    expect(filledAgo(now - 5 * 86400000, now)).toBe('Filled here 5 days ago')
    expect(filledAgo(now - 90 * 86400000, now)).toMatch(/^Filled here on /)
  })
})
