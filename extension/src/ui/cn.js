// Join class names, skipping falsy values.
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

// Shared focus ring for interactive elements.
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
