// @vitest-environment jsdom
// Filling must update React state, not just the DOM value; otherwise the site submits empty fields.
import { describe, it, expect } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { findFillableInputs, fillFields } from '../src/lib/detectFields.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function SignupForm({ onState }) {
  const [form, setForm] = React.useState({ email: '', firstName: '', country: '' })
  React.useEffect(() => { onState(form) }, [form])
  const bind = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) })
  return (
    <form>
      <label htmlFor="em">Email</label>
      <input id="em" {...bind('email')} />
      <label htmlFor="fn">First name</label>
      <input id="fn" {...bind('firstName')} />
      <label htmlFor="co">Country</label>
      <select id="co" {...bind('country')}>
        <option value="">Select</option>
        <option value="IN">India</option>
      </select>
    </form>
  )
}

describe('React controlled inputs', () => {
  it('updates component state when filled', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    let state = {}
    const root = createRoot(container)
    await act(async () => root.render(<SignupForm onState={(s) => (state = s)} />))

    await act(async () => {
      fillFields(findFillableInputs(document), { email: 'asha@example.com', fullName: 'Asha Verma', country: 'India' })
    })

    expect(state).toEqual({ email: 'asha@example.com', firstName: 'Asha', country: 'IN' })
    await act(async () => root.unmount())
  })
})
