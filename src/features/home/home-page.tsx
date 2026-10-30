import { Award, ClipboardCheck, GraduationCap, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

const steps = [
  {
    icon: Layers,
    title: 'Join a stack',
    text: 'Apply to the tech stack you want to learn. A stack lead reviews your application.',
  },
  {
    icon: GraduationCap,
    title: 'Learn module by module',
    text: 'Work through lessons in order, guided by experienced stack leads.',
  },
  {
    icon: ClipboardCheck,
    title: 'Prove it',
    text: 'Complete assignments for every module, then pass the final exam.',
  },
  {
    icon: Award,
    title: 'Get certified',
    text: 'Receive a signed digital certificate that anyone can verify online.',
  },
]

export function HomePage() {
  return (
    <>
      <section className="bg-brand text-brand-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Learn.{' '}
            <span className="underline decoration-[var(--accent)] decoration-4 underline-offset-8">
              Grow.
            </span>{' '}
            Build.
          </h1>
          <p className="mt-6 max-w-xl text-lg opacity-90">
            Structured, stack-led tech learning with real assignments, a final exam and a verifiable
            certificate at the end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link to="/join">Join a stack</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-brand-foreground/40 bg-transparent text-brand-foreground hover:bg-brand-foreground/10"
            >
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Card className="h-full">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <CardTitle className="mt-3">
                  {i + 1}. {title}
                </CardTitle>
                <CardDescription className="mt-1">{text}</CardDescription>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
