import React from 'react'
import { X } from 'lucide-react'
import { cn, focusRing } from './cn'
import { Button, IconButton } from './Button'

// Modal dialog built on native <dialog>: focus trapping, Esc to close and the backdrop come for free.
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      // Native <dialog> focuses the first control (the close button); prefer the marked default action.
      d.querySelector('[data-autofocus]')?.focus()
    }
    if (!open && d.open) d.close()
  }, [open])
  const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]
  // The <dialog> is a transparent full-screen layer; the panel is centered inside it with flexbox.
  // Clicking the layer (outside the panel) closes the dialog.
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose?.()}
      aria-labelledby={title ? 'sf-dialog-title' : undefined}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none p-4 bg-transparent backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex items-center justify-center"
    >
      {open && (
        <div className={cn('w-full max-h-full overflow-auto p-5 rounded-2xl border border-line bg-surface text-fg shadow-sf-lg animate-sf-scale-in', width)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && <h2 id="sf-dialog-title" className="text-base font-semibold">{title}</h2>}
              {description && <p className="text-[13px] text-fg-muted mt-1">{description}</p>}
            </div>
            <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-1.5 -mt-1" />
          </div>
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', danger }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          {/* Destructive confirms focus Cancel so an accidental Enter is harmless */}
          <Button onClick={onClose} data-autofocus={danger ? '' : undefined}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }} data-autofocus={danger ? undefined : ''}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}

function useDismiss(open, onClose, refs) {
  React.useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (refs.every((r) => !r.current?.contains(e.target))) onClose()
    }
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
}

// Menu attached to a trigger. items: [{ label, icon, onSelect, danger, shortcut } | 'separator']
export function DropdownMenu({ trigger, items, align = 'end', label, className }) {
  const [open, setOpen] = React.useState(false)
  const [up, setUp] = React.useState(false)
  const triggerRef = React.useRef(null)
  const menuRef = React.useRef(null)
  const close = () => setOpen(false)
  useDismiss(open, close, [triggerRef, menuRef])

  React.useLayoutEffect(() => {
    if (!open) return setUp(false)
    // Flip above the trigger when there isn't room below.
    const menu = menuRef.current
    const t = triggerRef.current?.getBoundingClientRect()
    if (menu && t) setUp(t.bottom + menu.offsetHeight + 8 > window.innerHeight && t.top > menu.offsetHeight + 8)
    menu?.querySelector('[role="menuitem"]')?.focus()
  }, [open])

  const onMenuKey = (e) => {
    const nodes = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'))
    const i = nodes.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); nodes[(i + 1) % nodes.length]?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); nodes[(i - 1 + nodes.length) % nodes.length]?.focus() }
    if (e.key === 'Escape' || e.key === 'Tab') { close(); triggerRef.current?.focus() }
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      {React.cloneElement(trigger, {
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: (e) => { trigger.props.onClick?.(e); setOpen((o) => !o) },
      })}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className={cn(
            'absolute z-[70] min-w-[180px] p-1 rounded-xl border border-line bg-surface shadow-sf-lg animate-sf-scale-in',
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            align === 'end' ? 'right-0' : 'left-0',
            up ? (align === 'end' ? 'origin-bottom-right' : 'origin-bottom-left') : align === 'end' ? 'origin-top-right' : 'origin-top-left'
          )}
        >
          {items.map((item, i) =>
            item === 'separator' ? (
              <div key={i} role="separator" className="my-1 h-px bg-line" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => { close(); item.onSelect?.() }}
                className={cn(
                  'w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] text-left outline-none',
                  'focus:bg-surface-2 hover:bg-surface-2',
                  item.danger ? 'text-danger' : 'text-fg'
                )}
              >
                {item.icon && <item.icon size={15} aria-hidden className={item.danger ? '' : 'text-fg-muted'} />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && <span className="text-[11px] text-fg-subtle">{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// Hover/focus tooltip for short hints.
export function Tooltip({ content, side = 'top', children }) {
  const [show, setShow] = React.useState(false)
  const id = React.useId()
  const pos = side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {React.cloneElement(children, { 'aria-describedby': show ? id : undefined })}
      {show && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap',
            'px-2 py-1 rounded-md bg-fg text-bg text-[11px] font-medium shadow-sf-md animate-sf-fade-in',
            pos
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}

// ---------- Toasts ----------

const ToastContext = React.createContext(null)

const TOAST_TONES = {
  neutral: 'border-line',
  success: 'border-success/40',
  danger: 'border-danger/40',
}

// Wrap a page once: <ToastProvider>…</ToastProvider>; then const toast = useToast(); toast({ title, action })
export function ToastProvider({ children, position = 'bottom' }) {
  const [toasts, setToasts] = React.useState([])
  const dismiss = React.useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = React.useCallback(
    ({ title, description, tone = 'neutral', icon, action, duration = 4000 }) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t.slice(-2), { id, title, description, tone, icon, action }])
      if (duration) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className={cn(
          'fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-3 pointer-events-none',
          position === 'bottom' ? 'bottom-3' : 'top-3'
        )}
      >
        {toasts.map((t) => {
          const Icon = t.icon
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-xl border bg-surface px-3.5 py-2.5 shadow-sf-lg animate-sf-slide-up',
                TOAST_TONES[t.tone]
              )}
            >
              {Icon && (
                <Icon
                  size={16}
                  aria-hidden
                  className={cn('mt-0.5 shrink-0', t.tone === 'success' ? 'text-success' : t.tone === 'danger' ? 'text-danger' : 'text-fg-muted')}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-fg">{t.title}</p>
                {t.description && <p className="text-xs text-fg-muted mt-0.5">{t.description}</p>}
              </div>
              {t.action && (
                <button
                  type="button"
                  onClick={() => { dismiss(t.id); t.action.onClick() }}
                  className={cn('shrink-0 text-[13px] font-semibold text-accent-text hover:underline rounded', focusRing)}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
