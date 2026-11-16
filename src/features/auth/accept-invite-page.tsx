import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setPasswordAndName } from './api'
import { useAuth } from './auth-context'
import { homeForRole } from './roles'

const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(120),
    password: z.string().min(10, 'Use at least 10 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type FormValues = z.infer<typeof schema>

/**
 * Landing page for the invitation email. The link signs the person in; here they finish
 * their account by choosing a name and password.
 */
export function AcceptInvitePage() {
  const { status, session, role, profile } = useAuth()
  const queryClient = useQueryClient()
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // The name from the join application is already on the profile: start from it.
  const knownName = profile?.full_name ?? ''
  useEffect(() => {
    if (knownName && !getValues('fullName')) setValue('fullName', knownName)
  }, [knownName, getValues, setValue])

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
        <Card lift="lg" className="p-8">
          <CardTitle className="text-xl">This invitation link has expired</CardTitle>
          <CardDescription className="mt-2">
            Invitation links only work once and for a limited time. Your account is already set up:
            choose a password using the email address the invitation was sent to, then sign in.
          </CardDescription>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/forgot-password">Set my password</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Go to sign in</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      await setPasswordAndName(values.password, values.fullName, session.user.id)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Your account is ready.')
      setDone(true)
    } catch {
      toast.error('Could not save your details. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card lift="lg" className="p-8">
        <CardTitle className="text-xl">Finish setting up your account</CardTitle>
        <CardDescription className="mt-1">
          Welcome! Choose your name and a password to continue.
        </CardDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          {(
            [
              ['fullName', 'Full name', 'text', 'name'],
              ['password', 'Password', 'password', 'new-password'],
              ['confirm', 'Confirm password', 'password', 'new-password'],
            ] as const
          ).map(([name, label, type, autoComplete]) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                type={type}
                autoComplete={autoComplete}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                {...register(name)}
              />
              {errors[name] && (
                <p id={`${name}-error`} className="text-sm text-danger">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" loading={submitting}>
            Save and continue
          </Button>
        </form>
      </Card>
    </div>
  )
}
