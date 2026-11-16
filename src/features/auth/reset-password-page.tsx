import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updatePassword } from './api'
import { useAuth } from './auth-context'
import { homeForRole } from './roles'

const schema = z
  .object({
    password: z.string().min(10, 'Use at least 10 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type FormValues = z.infer<typeof schema>

/** Landing page for the reset email: the link signs the person in with a recovery session. */
export function ResetPasswordPage() {
  const { status, session, role } = useAuth()
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-md p-6">
        <LoadingState rows={2} />
      </div>
    )
  }
  if (done && role) return <Navigate to={homeForRole(role)} replace />

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card lift="sm" className="p-8">
          <CardTitle className="font-display text-2xl">This reset link is not valid</CardTitle>
          <CardDescription className="mt-2">
            It may have expired or already been used. Request a new one and try again.
          </CardDescription>
          <Button asChild className="mt-6">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      await updatePassword(values.password)
      toast.success('Your password has been changed.')
      setDone(true)
    } catch {
      toast.error('Could not change your password. Please request a new link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card lift="sm" className="p-8">
        <CardTitle className="font-display text-3xl">Choose a new password</CardTitle>
        <CardDescription className="mt-1">Use at least 10 characters.</CardDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <FormField id="reset-password" label="New password" error={errors.password?.message}>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reset-password-error' : undefined}
              {...register('password')}
            />
          </FormField>
          <FormField
            id="reset-confirm"
            label="Confirm new password"
            error={errors.confirm?.message}
          >
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? 'reset-confirm-error' : undefined}
              {...register('confirm')}
            />
          </FormField>
          <Button type="submit" className="w-full" loading={submitting}>
            Save password
          </Button>
        </form>
      </Card>
    </div>
  )
}
