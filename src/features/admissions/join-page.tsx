import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { listStacks, stackKeys } from '@/features/stacks/api'
import { friendlyError } from '@/lib/errors'
import { submitApplication } from './api'
import { applicationSchema, type ApplicationInput } from './schemas'

export function JoinPage() {
  const stacks = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      stack_id: '',
      motivation: '',
      website: '',
    },
  })

  // A stack row on the landing page links here with ?stack=<slug>.
  const [params] = useSearchParams()
  const wanted = params.get('stack')
  useEffect(() => {
    const match = stacks.data?.find((st) => st.slug === wanted && st.is_active)
    if (match && !getValues('stack_id')) setValue('stack_id', match.id)
  }, [stacks.data, wanted, setValue, getValues])

  const submit = useMutation({
    mutationFn: submitApplication,
    onError: (e) => {
      const duplicate = (e as { code?: string }).code === '23505'
      setError('root', {
        message: duplicate
          ? 'You have already applied to this stack. A stack lead will review your application soon.'
          : friendlyError(e, 'We could not send your application. Please try again.'),
      })
    },
  })

  if (submit.isSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Application received</h1>
          <p className="mt-2 text-muted-foreground">
            A stack lead will review your application. If you are approved, you will get an email
            with a link to set up your account.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Back to home</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const active = stacks.data?.filter((s) => s.is_active) ?? []

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <PageHeader
        title="Join a stack"
        description="Tell us a little about you. A stack lead reviews every application."
      />
      {stacks.error && (
        <ErrorState message={friendlyError(stacks.error)} onRetry={() => void stacks.refetch()} />
      )}
      <Card lift="lg" className="p-6 sm:p-8">
        <form onSubmit={handleSubmit((v) => submit.mutate(v))} className="space-y-4" noValidate>
          <FormField id="apply-name" label="Full name" error={errors.full_name?.message}>
            <Input
              id="apply-name"
              autoComplete="name"
              aria-invalid={!!errors.full_name}
              aria-describedby={errors.full_name ? 'apply-name-error' : undefined}
              {...register('full_name')}
            />
          </FormField>
          <FormField id="apply-email" label="Email" error={errors.email?.message}>
            <Input
              id="apply-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'apply-email-error' : undefined}
              {...register('email')}
            />
          </FormField>
          <FormField id="apply-phone" label="Phone (optional)" error={errors.phone?.message}>
            <Input
              id="apply-phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              {...register('phone')}
            />
          </FormField>
          <FormField id="apply-stack" label="Stack" error={errors.stack_id?.message}>
            <Select
              id="apply-stack"
              aria-invalid={!!errors.stack_id}
              aria-describedby={errors.stack_id ? 'apply-stack-error' : undefined}
              {...register('stack_id')}
            >
              <option value="">Select a stack</option>
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            id="apply-motivation"
            label="Why do you want to join? (optional)"
            error={errors.motivation?.message}
          >
            <Textarea
              id="apply-motivation"
              aria-invalid={!!errors.motivation}
              {...register('motivation')}
            />
          </FormField>
          {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="apply-website">Leave this field empty</label>
            <input id="apply-website" tabIndex={-1} autoComplete="off" {...register('website')} />
          </div>
          {errors.root && (
            <p role="alert" className="text-sm text-danger">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={submit.isPending}>
            Send application
          </Button>
        </form>
      </Card>
    </div>
  )
}
