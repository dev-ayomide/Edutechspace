import { useState } from 'react'
import { Logo } from '@/components/logo'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Select } from '@/components/ui/select'
import { Table, Td, Th } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/app/theme'

const swatches = [
  ['background', 'bg-background'],
  ['surface', 'bg-surface'],
  ['muted', 'bg-muted'],
  ['brand', 'bg-brand'],
  ['primary', 'bg-primary'],
  ['accent', 'bg-accent'],
  ['accent-soft', 'bg-accent-soft'],
  ['gold', 'bg-gold'],
  ['gold-soft', 'bg-gold-soft'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
  ['danger', 'bg-danger'],
] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-display text-2xl font-extrabold">{title}</h2>
      {children}
    </section>
  )
}

/** Development-only reference for the design system. Not routed in production builds. */
export function GalleryPage() {
  const [value, setValue] = useState(54)
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Design system"
          description="Direction B: bright, bold, human. Dev-only reference."
        />
        <ThemeToggle />
      </div>

      <Section title="Logo">
        <div className="flex flex-wrap items-center gap-10">
          <Logo />
          <Logo className="origin-left scale-125" />
          <Logo markOnly className="h-14" />
        </div>
      </Section>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([name, cls]) => (
            <div key={name} className="overflow-hidden rounded-2xl border-2 border-outline">
              <div className={`${cls} h-16`} />
              <p className="bg-card px-3 py-2 text-xs font-bold">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <p className="font-display text-6xl leading-none font-extrabold tracking-tighter sm:text-8xl">
          Learn. Grow. Build.
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold">Heading one (Sora 800)</h1>
        <h2 className="mt-3 font-display text-2xl font-extrabold">Heading two</h2>
        <p className="mt-3 max-w-prose text-base">
          Body text in Instrument Sans. Learners move through modules in order, earning each unlock,
          then sit a final exam and receive a certificate anyone can verify.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Muted supporting text, always at least 4.5:1 contrast.
        </p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <CardTitle>Default</CardTitle>
            <CardDescription className="mt-1">Bold outline, roomy radius.</CardDescription>
          </Card>
          <Card tone="accent" lift="lg">
            <CardTitle>Accent, lifted</CardTitle>
            <CardDescription className="mt-1 text-accent-foreground">
              Used for the single most important action.
            </CardDescription>
          </Card>
          <Card tone="ink">
            <CardTitle>Ink</CardTitle>
            <CardDescription className="mt-1 text-brand-foreground/80">
              Dark blocks create rhythm.
            </CardDescription>
          </Card>
          <Card tone="gold" lift="lg">
            <CardTitle>Gold</CardTitle>
            <CardDescription className="mt-1 text-gold-foreground">
              Reserved for achievement.
            </CardDescription>
          </Card>
          <Card tone="soft">
            <CardTitle>Soft</CardTitle>
            <CardDescription className="mt-1">Quiet panel on the page background.</CardDescription>
          </Card>
        </div>
      </Section>

      <Section title="Progress">
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <ProgressRing value={value} label="Overall progress" />
          <div className="space-y-4">
            <Progress value={value} label="Lessons" />
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              aria-label="Change progress"
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Lessons" value="15 / 20" />
              <StatCard label="Assignments" value="2 / 4" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="gold">Gold</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-xl gap-4">
          <Input placeholder="Text input" aria-label="Text input" />
          <Input aria-invalid placeholder="Invalid input" aria-label="Invalid input" />
          <Select aria-label="Select">
            <option>Select a stack</option>
            <option>Frontend Development</option>
          </Select>
          <Textarea placeholder="Textarea" aria-label="Textarea" />
        </div>
      </Section>

      <Section title="Table">
        <Table>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Progress</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>Ṣọlá Adéyẹmí</Td>
              <Td>54%</Td>
              <Td>
                <Badge variant="primary">In progress</Badge>
              </Td>
            </tr>
            <tr>
              <Td>Maria Gomez</Td>
              <Td>100%</Td>
              <Td>
                <Badge variant="gold">Certified</Badge>
              </Td>
            </tr>
          </tbody>
        </Table>
      </Section>

      <Section title="States">
        <div className="grid gap-5 sm:grid-cols-3">
          <LoadingState rows={2} />
          <EmptyState title="Nothing here yet" description="Friendly, specific empty states." />
          <ErrorState message="Something went wrong." onRetry={() => undefined} />
        </div>
      </Section>
    </div>
  )
}
