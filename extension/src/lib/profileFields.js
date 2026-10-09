// Profile fields shown in the options page and the context menu.

export const PROFILE_SECTIONS = [
  {
    title: 'Personal',
    fields: [
      { name: 'fullName', label: 'Full Name', placeholder: 'John Doe' },
      { name: 'firstName', label: 'First Name', placeholder: 'Auto from full name if empty' },
      { name: 'middleName', label: 'Middle Name', placeholder: 'Michael' },
      { name: 'lastName', label: 'Last Name', placeholder: 'Auto from full name if empty' },
      { name: 'username', label: 'Username', placeholder: 'johndoe' },
      { name: 'dob', label: 'Date of Birth', type: 'date' },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { name: 'email', label: 'Email', placeholder: 'john@example.com' },
      { name: 'phone', label: 'Phone', placeholder: '+1 555-1234' },
      { name: 'phone2', label: 'Alternate Phone', placeholder: '+1 555-5678' },
    ],
  },
  {
    title: 'Work',
    fields: [
      { name: 'company', label: 'Company', placeholder: 'Acme Inc.' },
      { name: 'jobTitle', label: 'Job Title', placeholder: 'Software Engineer' },
      { name: 'website', label: 'Website', placeholder: 'https://example.com' },
      { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/john' },
      { name: 'github', label: 'GitHub', placeholder: 'https://github.com/john' },
      { name: 'portfolio', label: 'Portfolio', placeholder: 'https://john.dev' },
    ],
  },
  {
    title: 'Professional',
    fields: [
      { name: 'yearsExperience', label: 'Years of Experience', placeholder: '5' },
      { name: 'noticePeriod', label: 'Notice Period', placeholder: '30 days' },
      { name: 'currentCtc', label: 'Current Salary / CTC', placeholder: '12 LPA' },
      { name: 'expectedCtc', label: 'Expected Salary / CTC', placeholder: '18 LPA' },
      { name: 'bio', label: 'Short Bio / About Me', type: 'textarea', placeholder: 'Used for "About yourself" style fields', full: true },
    ],
  },
  {
    title: 'Address',
    fields: [
      { name: 'address1', label: 'Address Line 1', placeholder: '123 Main St' },
      { name: 'address2', label: 'Address Line 2', placeholder: 'Apt 4B' },
      { name: 'city', label: 'City', placeholder: 'San Francisco' },
      { name: 'state', label: 'State/Province', placeholder: 'CA' },
      { name: 'zip', label: 'ZIP/Postal', placeholder: '94105' },
      { name: 'country', label: 'Country', placeholder: 'USA' },
    ],
  },
]

// Flat list of { name, label } for menus.
export const PROFILE_FIELDS = PROFILE_SECTIONS.flatMap((s) => s.fields.map(({ name, label }) => ({ name, label })))
