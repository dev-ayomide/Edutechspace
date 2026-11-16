import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { requestPasswordReset } from './api'

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
})
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: FormValues) => {
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
    } catch (e) {
      // A rate limit is worth telling the person about; everything else looks the same as success so the
      // form cannot be used to discover which emails have accounts.
      if ((e as { status?: number }).status === 429) {
        toast.error('Too many requests. Please wait a few minutes and try again.')
        setSubmitting(false)
        return
      }
    }
    setSent(true)
    setSubmitting(false)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card lift="sm" className="w-full p-8">
        {sent ? (
          <div role="status" className="text-center">
            <MailCheck className="mx-auto size-10 text-success" aria-hidden="true" />
            <CardTitle className="mt-3 font-display text-3xl">Check your email</CardTitle>
            <CardDescription className="mt-2">
              If that address has an account, we have sent a link to choose a new password. It can
              take a minute to arrive.
            </CardDescription>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <CardTitle className="font-display text-3xl">Forgot your password?</CardTitle>
            <CardDescription className="mt-1">
              Enter your email and we will send you a link to choose a new one.
            </CardDescription>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <FormField id="forgot-email" label="Email" error={errors.email?.message}>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                  {...register('email')}
                />
              </FormField>
              <Button type="submit" className="w-full" loading={submitting}>
                Send reset link
              </Button>
            </form>
            <p className="mt-6 text-center text-sm">
              <Link to="/login" className="font-semibold text-link underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
