// Simple storage helpers wrapping chrome.storage.local
export async function getProfile() {
  const { profile } = await chrome.storage.local.get(['profile'])
  return (
    profile || {
      fullName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
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
      customFields: []
    }
  )
}

export async function saveProfile(profile) {
  await chrome.storage.local.set({ profile })
}

// Custom rules: [{ sitePattern: string, selector?: string, labelRegex?: string, key?: string, value?: string }]
export async function getRules() {
  const { rules } = await chrome.storage.local.get(['rules'])
  return rules || []
}

export async function saveRules(rules) {
  await chrome.storage.local.set({ rules })
}
