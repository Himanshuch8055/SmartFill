import React from 'react'

// Small Markdown renderer for CHANGELOG.md (Keep a Changelog format): headings, lists,
// paragraphs, **bold**, `code` and [links](url). Link reference definitions are dropped.
function inline(text, key = 0) {
  const parts = []
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[2]) parts.push(<strong key={`${key}-${m.index}`}>{m[2]}</strong>)
    else if (m[3]) parts.push(<code key={`${key}-${m.index}`}>{m[3]}</code>)
    else parts.push(<a key={`${key}-${m.index}`} href={m[5]} target="_blank" rel="noreferrer">{m[4]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

// Version headings like "[1.0.0] - 2026-10-09" become "1.0.0" with the date separate.
function versionHeading(text) {
  const m = text.match(/^\[([^\]]+)\](?:\s*-\s*(.+))?$/)
  return m ? { version: m[1], date: m[2] } : { version: text }
}

export function renderChangelog(md) {
  const lines = md.replace(/\r/g, '').split('\n')
  const out = []
  let list = null
  let para = []
  const flush = () => {
    if (para.length) out.push(<p key={out.length}>{inline(para.join(' '), out.length)}</p>)
    para = []
    if (list) out.push(<ul key={out.length}>{list}</ul>)
    list = null
  }
  for (const line of lines) {
    if (/^\[[^\]]+\]:\s/.test(line)) continue // link reference definitions
    if (line.startsWith('# ')) { flush(); continue } // page title is rendered by the page
    if (line.startsWith('## ')) {
      flush()
      const { version, date } = versionHeading(line.slice(3).trim())
      out.push(
        <h2 key={out.length} id={version.toLowerCase()}>
          {version} {date && <span className="ml-2 text-sm font-normal text-fg-subtle">{date}</span>}
        </h2>
      )
      continue
    }
    if (line.startsWith('### ')) { flush(); out.push(<h3 key={out.length}>{line.slice(4)}</h3>); continue }
    const li = line.match(/^\s*[-*]\s+(.*)$/)
    if (li) {
      if (para.length) { out.push(<p key={out.length}>{inline(para.join(' '), out.length)}</p>); para = [] }
      list ||= []
      list.push(<li key={list.length}>{inline(li[1], `${out.length}-${list.length}`)}</li>)
      continue
    }
    if (!line.trim()) { flush(); continue }
    para.push(line.trim())
  }
  flush()
  return out
}
