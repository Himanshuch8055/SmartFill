import React from 'react'
import { cn } from './cn'

export function Card({ className, padded = true, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface shadow-sf-sm', padded && 'p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function SectionHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-fg leading-6">{title}</h2>
        {description && <p className="text-[13px] text-fg-muted mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

const TONES = {
  neutral: 'bg-surface-2 text-fg-muted border-line',
  accent: 'bg-accent-subtle text-accent-text border-transparent',
  success: 'bg-success-subtle text-success border-transparent',
  warning: 'bg-warning-subtle text-warning border-transparent',
  danger: 'bg-danger-subtle text-danger border-transparent',
}

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 h-5 px-2 rounded-full border text-[11px] font-medium whitespace-nowrap', TONES[tone], className)}>
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  )
}

// Keyboard shortcut chip: <Kbd keys={['Alt', 'Shift', 'F']} />
export function Kbd({ keys, className }) {
  const list = Array.isArray(keys) ? keys : [keys]
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {list.map((k) => (
        <kbd key={k} className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded border border-line border-b-2 bg-surface text-[11px] font-medium text-fg-muted font-sans">
          {k}
        </kbd>
      ))}
    </span>
  )
}

// Thin progress bar, e.g. profile completeness.
export function Progress({ value, max = 100, label, tone = 'accent', className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = tone === 'success' ? 'bg-success' : 'bg-accent'
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-1.5 w-full rounded-full bg-surface-2 overflow-hidden', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-300', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center text-center px-6 py-10 rounded-xl border border-dashed border-line', className)}>
      {Icon && (
        <div className="h-10 w-10 rounded-full bg-surface-2 grid place-items-center text-fg-muted mb-3">
          <Icon size={20} aria-hidden />
        </div>
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="text-[13px] text-fg-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Divider({ className }) {
  return <hr className={cn('border-0 h-px bg-line', className)} />
}

// SmartFill logo mark. Inline SVG so it renders instantly and follows the accent color.
export function Logo({ size = 24, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="rgb(var(--sf-accent))" />
      <path d="M9 11.5h14M9 16h9M9 20.5h11" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="23" cy="20.5" r="2.4" fill="white" />
    </svg>
  )
}
