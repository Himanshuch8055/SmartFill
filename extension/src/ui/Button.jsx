import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn, focusRing } from './cn'

const VARIANTS = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-sf-sm',
  secondary: 'bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong shadow-sf-sm',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger-solid text-white hover:brightness-110 shadow-sf-sm',
  'danger-ghost': 'text-danger hover:bg-danger-subtle',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
}

const ICON_SIZES = { sm: 14, md: 16, lg: 18 }

export const Button = React.forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, fullWidth, className, children, disabled, ...props },
  ref
) {
  const s = ICON_SIZES[size]
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none transition-colors duration-150',
        'disabled:opacity-50 disabled:pointer-events-none active:translate-y-px motion-reduce:active:translate-y-0',
        focusRing,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={s} className="animate-spin" aria-hidden /> : Icon && <Icon size={s} aria-hidden />}
      {children}
      {IconRight && !loading && <IconRight size={s} aria-hidden />}
    </button>
  )
})

// Square icon-only button. `label` is required for screen readers and the tooltip.
export const IconButton = React.forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className, ...props },
  ref
) {
  const box = { sm: 'h-8 w-8 rounded-lg', md: 'h-9 w-9 rounded-lg', lg: 'h-11 w-11 rounded-xl' }[size]
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center shrink-0 transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
        focusRing,
        VARIANTS[variant],
        box,
        className
      )}
      {...props}
    >
      <Icon size={ICON_SIZES[size]} aria-hidden />
    </button>
  )
})
