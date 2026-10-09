// Component gallery: every UI kit component in its states. Opened from the preview hub.
import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import {
  initTheme, applyTheme, Button, IconButton, Field, Input, Textarea, Select, Switch, Checkbox, SegmentedControl,
  Card, SectionHeader, Badge, Kbd, Progress, EmptyState, Divider, Logo,
  Dialog, ConfirmDialog, DropdownMenu, Tooltip, ToastProvider, useToast,
} from '../ui'
import {
  Wand2, Undo2, Settings, Trash2, Copy, Pencil, MoreHorizontal, Plus, Sun, Moon, Monitor, CheckCircle2, ShieldOff, Globe, Inbox,
} from 'lucide-react'

initTheme()

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</h2>
      {children}
    </section>
  )
}

function Gallery() {
  const toast = useToast()
  const [theme, setTheme] = React.useState('system')
  const [sw, setSw] = React.useState(true)
  const [cb, setCb] = React.useState(true)
  const [seg, setSeg] = React.useState('preview')
  const [dialog, setDialog] = React.useState(false)
  const [confirm, setConfirm] = React.useState(false)
  React.useEffect(() => applyTheme(theme), [theme])

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <div>
            <h1 className="text-xl font-semibold">SmartFill UI kit</h1>
            <p className="text-[13px] text-fg-muted">Tokens and components shared by popup, options, welcome and on-page UI.</p>
          </div>
        </div>
        <SegmentedControl
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'System', icon: Monitor },
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ]}
        />
      </header>

      <Section title="Colors">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {['bg', 'surface', 'surface-2', 'line', 'accent', 'success', 'warning', 'danger'].map((c) => (
            <div key={c} className="space-y-1">
              <div className="h-12 rounded-lg border border-line" style={{ background: `rgb(var(--sf-${c}))` }} />
              <p className="text-[11px] text-fg-muted">{c}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={Wand2}>Fill form</Button>
          <Button icon={Undo2}>Undo</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" icon={Trash2}>Delete</Button>
          <Button variant="danger-ghost">Remove</Button>
          <Button variant="primary" loading>Filling…</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="primary">Small</Button>
          <Button size="md" variant="primary">Medium</Button>
          <Button size="lg" variant="primary" icon={Wand2}>Large</Button>
          <IconButton icon={Settings} label="Settings" />
          <IconButton icon={Plus} label="Add" variant="secondary" />
          <Tooltip content="Opens settings">
            <IconButton icon={Settings} label="Settings with tooltip" variant="secondary" />
          </Tooltip>
        </div>
      </Section>

      <Section title="Form controls">
        <Card className="grid sm:grid-cols-2 gap-5">
          <Field label="Email" hint="Used for sign-up and contact fields.">
            <Input type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Phone" error="Enter a valid phone number.">
            <Input defaultValue="98765" />
          </Field>
          <Field label="Country">
            <Select defaultValue="India">
              <option>India</option>
              <option>United States</option>
            </Select>
          </Field>
          <Field label="Middle name" optional>
            <Input placeholder="Michael" />
          </Field>
          <Field label="Short bio" className="sm:col-span-2">
            <Textarea placeholder="A few lines about you" />
          </Field>
          <Switch checked={sw} onChange={setSw} label="Preview before filling" description="Highlight fields and confirm before anything changes." />
          <Checkbox checked={cb} onChange={setCb} label="Show in popup" description="Include this profile in the quick switcher." />
          <div className="space-y-2">
            <p className="text-[13px] font-medium">Fill behavior</p>
            <SegmentedControl
              label="Fill behavior"
              value={seg}
              onChange={setSeg}
              options={[{ value: 'preview', label: 'Preview first' }, { value: 'instant', label: 'Fill instantly' }]}
            />
          </div>
        </Card>
      </Section>

      <Section title="Display">
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="space-y-4">
            <SectionHeader
              title="Contact"
              description="How sites reach you."
              actions={<Badge tone="accent">2 of 3</Badge>}
            />
            <Progress value={2} max={3} label="Contact completeness" />
            <div className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="accent" icon={Globe}>Pinned</Badge>
              <Badge tone="success" icon={CheckCircle2}>Saved</Badge>
              <Badge tone="warning">Partial</Badge>
              <Badge tone="danger" icon={ShieldOff}>Off on this site</Badge>
            </div>
            <Divider />
            <p className="text-[13px] text-fg-muted flex items-center gap-2">Fill form <Kbd keys={['Alt', 'Shift', 'F']} /></p>
          </Card>
          <EmptyState
            icon={Inbox}
            title="No site rules yet"
            description="Correct a field after a fill and SmartFill will offer to remember it."
            action={<Button size="sm" variant="primary" icon={Plus}>Add rule</Button>}
          />
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="danger-ghost" onClick={() => setConfirm(true)}>Delete profile…</Button>
          <DropdownMenu
            label="Profile actions"
            trigger={<IconButton icon={MoreHorizontal} label="Profile actions" variant="secondary" />}
            items={[
              { label: 'Rename', icon: Pencil, onSelect: () => toast({ title: 'Rename' }) },
              { label: 'Duplicate', icon: Copy, onSelect: () => toast({ title: 'Duplicated' }) },
              'separator',
              { label: 'Delete', icon: Trash2, danger: true, onSelect: () => setConfirm(true) },
            ]}
          />
          <Button onClick={() => toast({ title: 'Filled 12 fields', icon: CheckCircle2, tone: 'success', action: { label: 'Undo', onClick: () => toast({ title: 'Restored 12 fields' }) } })}>
            Success toast
          </Button>
          <Button onClick={() => toast({ title: "Couldn't fill this page", description: 'Reload the page and try again.', tone: 'danger', icon: ShieldOff })}>
            Error toast
          </Button>
        </div>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="Import backup"
          description="This will replace your current profiles and settings."
          footer={<><Button onClick={() => setDialog(false)}>Cancel</Button><Button variant="primary" onClick={() => setDialog(false)}>Import</Button></>}
        >
          <ul className="text-[13px] text-fg-muted space-y-1">
            <li>3 profiles</li>
            <li>12 site rules</li>
            <li>2 sites turned off</li>
          </ul>
        </Dialog>
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => toast({ title: 'Profile deleted', icon: Trash2 })}
          title="Delete “Work”?"
          description="This profile and its site settings will be removed. This can't be undone."
          confirmLabel="Delete"
          danger
        />
      </Section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <Gallery />
  </ToastProvider>
)
