import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithPassword } from './api'
import { useAuth } from './auth-context'
import { homeForRole } from './roles'

const schema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { status, role } = useAuth()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (status === 'authenticated' && role) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? homeForRole(role)} replace />
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      await signInWithPassword(values.email, values.password)
    } catch {
      toast.error('Incorrect email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card lift="lg" className="w-full p-8">
        <CardTitle className="font-display text-3xl">Welcome back</CardTitle>
        <CardDescription className="mt-1">
          Sign in to continue learning or teaching.
        </CardDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-danger">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-danger">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" loading={submitting}>
            Sign in
          </Button>
          <p className="text-center text-sm">
            <Link to="/forgot-password" className="font-semibold text-link underline">
              Forgot your password?
            </Link>
          </p>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here? Accounts are created when your application to join a stack is approved.
        </p>
      </Card>
    </div>
  )
}
