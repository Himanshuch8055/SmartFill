// Relative time labels for the fill history.

// "Filled here 3 days ago" for sites you already filled.
export function filledAgo(ts, now = Date.now()) {
  const mins = Math.round((now - ts) / 60000)
  if (mins < 1) return 'Filled here just now'
  if (mins < 60) return `Filled here ${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `Filled here ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Filled here yesterday'
  if (days < 30) return `Filled here ${days} days ago`
  return `Filled here on ${new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
}
