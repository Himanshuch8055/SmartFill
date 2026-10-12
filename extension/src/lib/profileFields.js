// Profile fields shown in the options page and the context menu.
import { mark } from './i18n'

export const PROFILE_SECTIONS = [
  {
    title: mark('Personal'),
    fields: [
      { name: 'fullName', label: mark('Full Name'), placeholder: 'John Doe' },
      { name: 'firstName', label: mark('First Name'), placeholder: mark('Auto from full name if empty') },
      { name: 'middleName', label: mark('Middle Name'), placeholder: 'Michael' },
      { name: 'lastName', label: mark('Last Name'), placeholder: mark('Auto from full name if empty') },
      { name: 'username', label: mark('Username'), placeholder: 'johndoe' },
      { name: 'dob', label: mark('Date of Birth'), type: 'date' },
      { name: 'gender', label: mark('Gender'), type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
    ],
  },
  {
    title: mark('Contact'),
    fields: [
      { name: 'email', label: mark('Email'), placeholder: 'john@example.com' },
      { name: 'phone', label: mark('Phone'), placeholder: '+1 555-1234' },
      { name: 'phone2', label: mark('Alternate Phone'), placeholder: '+1 555-5678' },
    ],
  },
  {
    title: mark('Work'),
    fields: [
      { name: 'company', label: mark('Company'), placeholder: 'Acme Inc.' },
      { name: 'jobTitle', label: mark('Job Title'), placeholder: 'Software Engineer' },
      { name: 'website', label: mark('Website'), placeholder: 'https://example.com' },
      { name: 'linkedin', label: mark('LinkedIn'), placeholder: 'https://linkedin.com/in/john' },
      { name: 'github', label: mark('GitHub'), placeholder: 'https://github.com/john' },
      { name: 'portfolio', label: mark('Portfolio'), placeholder: 'https://john.dev' },
    ],
  },
  {
    title: mark('Professional'),
    fields: [
      { name: 'yearsExperience', label: mark('Years of Experience'), placeholder: '5' },
      { name: 'noticePeriod', label: mark('Notice Period'), placeholder: mark('30 days') },
      { name: 'currentCtc', label: mark('Current Salary / CTC'), placeholder: '12 LPA' },
      { name: 'expectedCtc', label: mark('Expected Salary / CTC'), placeholder: '18 LPA' },
      { name: 'bio', label: mark('Short Bio / About Me'), type: 'textarea', placeholder: mark('Used for "About yourself" style fields'), full: true },
    ],
  },
  {
    title: mark('Education'),
    fields: [
      { name: 'school', label: mark('School / University'), placeholder: 'University of Pune' },
      { name: 'degree', label: mark('Degree'), placeholder: 'B.Tech' },
      { name: 'fieldOfStudy', label: mark('Field of Study'), placeholder: 'Computer Science' },
      { name: 'graduationYear', label: mark('Graduation Year'), placeholder: '2019' },
    ],
  },
  {
    title: mark('Address'),
    fields: [
      { name: 'address1', label: mark('Address Line 1'), placeholder: '123 Main St' },
      { name: 'address2', label: mark('Address Line 2'), placeholder: 'Apt 4B' },
      { name: 'city', label: mark('City'), placeholder: 'San Francisco' },
      { name: 'state', label: mark('State/Province'), placeholder: 'CA' },
      { name: 'zip', label: mark('ZIP/Postal'), placeholder: '94105' },
      { name: 'country', label: mark('Country'), placeholder: 'USA' },
    ],
  },
]

// Flat list of { name, label } for menus.
export const PROFILE_FIELDS = PROFILE_SECTIONS.flatMap((s) => s.fields.map(({ name, label }) => ({ name, label })))
