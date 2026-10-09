import React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn, focusRing } from './cn'

const control =
  'w-full rounded-lg border border-line bg-surface text-fg text-sm placeholder:text-fg-subtle shadow-sf-sm ' +
  'transition-colors duration-150 hover:border-line-strong ' +
  'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-focus/25 ' +
  'disabled:opacity-60 disabled:bg-surface-2'

const invalid = 'border-danger hover:border-danger focus:border-danger focus:ring-danger/20'

// Label + control + hint/error. Wires up ids and aria attributes for the child control.
export function Field({ label, hint, error, optional, className, children, id: idProp }) {
  const auto = React.useId()
  const id = idProp || auto
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const child = React.Children.only(children)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-fg flex items-center gap-1.5">
          {label}
          {optional && <span className="text-fg-subtle font-normal">Optional</span>}
        </label>
      )}
      {React.cloneElement(child, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, invalid: !!error })}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = React.forwardRef(function Input({ className, invalid: bad, ...props }, ref) {
  return <input ref={ref} className={cn(control, 'h-9 px-3', bad && invalid, className)} {...props} />
})

export const Textarea = React.forwardRef(function Textarea({ className, invalid: bad, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(control, 'px-3 py-2 leading-relaxed resize-y', bad && invalid, className)} {...props} />
})

// Native select (best keyboard and screen-reader support) with a custom chevron.
export const Select = React.forwardRef(function Select({ className, invalid: bad, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, 'h-9 pl-3 pr-9 appearance-none cursor-pointer', bad && invalid, className)} {...props}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden />
    </div>
  )
})

export function Switch({ checked, onChange, label, description, disabled, size = 'md', className, id: idProp }) {
  const auto = React.useId()
  const id = idProp || auto
  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const thumb = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5'
  const button = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 disabled:opacity-50',
        focusRing,
        track,
        checked ? 'bg-accent' : 'bg-line-strong'
      )}
    >
      <span
        aria-hidden
        className={cn('rounded-full bg-white shadow-sf-sm transition-transform duration-150', thumb, checked ? shift : 'translate-x-0')}
      />
    </button>
  )
  if (!label) return button
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="block text-[13px] text-fg-muted mt-0.5">{description}</span>}
      </label>
      {button}
    </div>
  )
}

export function Checkbox({ checked, onChange, label, description, disabled, className }) {
  const id = React.useId()
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span className="relative mt-0.5 inline-flex">
        <input
          id={id}
          type="checkbox"
          checked={!!checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className={cn(
            'peer h-4 w-4 appearance-none rounded border border-line-strong bg-surface transition-colors cursor-pointer',
            'checked:bg-accent checked:border-accent disabled:opacity-50',
            focusRing
          )}
        />
        <Check size={12} strokeWidth={3} aria-hidden className="pointer-events-none absolute inset-0 m-auto text-accent-fg opacity-0 peer-checked:opacity-100" />
      </span>
      {label && (
        <label htmlFor={id} className="text-sm text-fg cursor-pointer">
          {label}
          {description && <span className="block text-[13px] text-fg-muted">{description}</span>}
        </label>
      )}
    </div>
  )
}

// Single-choice segmented control (radiogroup) with arrow-key navigation.
export function SegmentedControl({ value, onChange, options, label, size = 'md', className }) {
  const refs = React.useRef([])
  const idx = options.findIndex((o) => o.value === value)
  const onKeyDown = (e) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = (idx + dir + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('inline-flex p-0.5 rounded-lg bg-surface-2 border border-line', className)}
    >
      {options.map((o, i) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (idx < 0 && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              focusRing,
              active ? 'bg-surface text-fg shadow-sf-sm' : 'text-fg-muted hover:text-fg'
            )}
          >
            {Icon && <Icon size={14} aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
