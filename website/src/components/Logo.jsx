import React from 'react'

// SmartFill mark (same artwork as extension/icons/icon.svg).
export default function Logo({ size = 28, className }) {
  const id = 'sf-logo' + React.useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <path d="M9.5 0h13C29 0 32 3 32 9.5v13C32 29 29 32 22.5 32h-13C3 32 0 29 0 22.5v-13C0 3 3 0 9.5 0Z" fill={`url(#${id})`} />
      <path d="M9 10.5h14M9 16h10M9 21.5h7" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="21.6" cy="21.5" r="2.3" fill="white" />
    </svg>
  )
}
