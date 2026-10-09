// Shared layout pieces for options pages: page header, grouped settings lists, rows.
import React from 'react'
import { cn } from '../ui'

export function PageHeader({ title, description, actions, children }) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {title && <h1 className="text-xl font-semibold tracking-[-0.01em]">{title}</h1>}
          {children}
          {description && <p className="mt-1 text-[13px] text-fg-muted max-w-xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

// A titled group of rows, like a settings section.
export function Group({ title, description, aside, children, className }) {
  return (
    <section className={cn('mb-8', className)}>
      {(title || aside) && (
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-[13px] font-semibold">{title}</h2>}
            {description && <p className="text-[12px] text-fg-muted mt-0.5">{description}</p>}
          </div>
          {aside && <div className="text-[12px] text-fg-subtle shrink-0">{aside}</div>}
        </div>
      )}
      <div className="rounded-lg border border-line bg-surface divide-y divide-line">{children}</div>
    </section>
  )
}

// Label (and optional description) on the left, control on the right.
export function SettingRow({ label, description, htmlFor, children }) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-[13px] font-medium block">{label}</label>
        {description && <p className="text-[12px] text-fg-muted mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function EmptyRow({ children }) {
  return <p className="px-4 py-6 text-[13px] text-fg-subtle text-center">{children}</p>
}

export function TextButton({ className, danger, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'text-[13px] rounded outline-none focus-visible:ring-2 focus-visible:ring-focus/60 disabled:opacity-40',
        danger ? 'text-danger hover:underline' : 'text-fg-muted hover:text-fg hover:underline',
        'underline-offset-2',
        className
      )}
      {...props}
    />
  )
}
