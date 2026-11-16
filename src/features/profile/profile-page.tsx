import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { updatePassword } from '@/features/auth/api'
import { friendlyError } from '@/lib/errors'
import { areaLabel } from '@/routes/nav'
import { saveContactDetails } from './api'

const detailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  phone: z
    .string()
    .trim()
    .max(30, 'Use at most 30 characters')
    .regex(/^[+\d\s()-]*$/, 'Use digits, spaces and + ( ) - only'),
})
type Details = z.infer<typeof detailsSchema>

const passwordSchema = z
  .object({
    password: z.string().min(10, 'Use at least 10 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type Passwords = z.infer<typeof passwordSchema>

/** The signed-in person's own details and password. Same page for students, leads and admins. */
export function ProfilePage() {
  const { profile, session } = useAuth()
  const queryClient = useQueryClient()
  const [savingDetails, setSavingDetails] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const details = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: profile?.full_name ?? '', phone: profile?.phone ?? '' },
  })
  const { reset } = details
  useEffect(() => {
    if (profile) reset({ fullName: profile.full_name ?? '', phone: profile.phone ?? '' })
  }, [profile, reset])

  const passwords = useForm<Passwords>({ resolver: zodResolver(passwordSchema) })

  if (!profile || !session) return <LoadingState />

  const onDetails = async (v: Details) => {
    setSavingDetails(true)
    try {
      await saveContactDetails(session.user.id, v.fullName, v.phone)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Your details are saved.')
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setSavingDetails(false)
    }
  }

  const onPassword = async (v: Passwords) => {
    setSavingPassword(true)
    try {
      await updatePassword(v.password)
      passwords.reset({ password: '', confirm: '' })
      toast.success('Your password is changed.')
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setSavingPassword(false)
    }
  }

  const dErr = details.formState.errors
  const pErr = passwords.formState.errors

  return (
    <>
      <PageHeader title="Profile" description="Your details and password." />
      <div className="grid max-w-3xl gap-6">
        <Card className="p-6">
          <CardTitle>Your details</CardTitle>
          <CardDescription className="mt-1">
            {profile.email} · {areaLabel[profile.role]}. To change your email address, contact an
            admin.
          </CardDescription>
          <form onSubmit={details.handleSubmit(onDetails)} className="mt-5 space-y-4" noValidate>
            <FormField id="profile-name" label="Full name" error={dErr.fullName?.message}>
              <Input
                id="profile-name"
                autoComplete="name"
                aria-invalid={!!dErr.fullName}
                aria-describedby={dErr.fullName ? 'profile-name-error' : undefined}
                {...details.register('fullName')}
              />
            </FormField>
            <FormField
              id="profile-phone"
              label="Phone (optional)"
              hint={profile.role === 'student' ? 'Your stack leads can see this.' : undefined}
              error={dErr.phone?.message}
            >
              <Input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                aria-invalid={!!dErr.phone}
                aria-describedby={dErr.phone ? 'profile-phone-error' : undefined}
                {...details.register('phone')}
              />
            </FormField>
            <Button type="submit" loading={savingDetails}>
              Save details
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <CardTitle>Change password</CardTitle>
          <form onSubmit={passwords.handleSubmit(onPassword)} className="mt-5 space-y-4" noValidate>
            <FormField id="profile-password" label="New password" error={pErr.password?.message}>
              <Input
                id="profile-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!pErr.password}
                aria-describedby={pErr.password ? 'profile-password-error' : undefined}
                {...passwords.register('password')}
              />
            </FormField>
            <FormField
              id="profile-confirm"
              label="Confirm new password"
              error={pErr.confirm?.message}
            >
              <Input
                id="profile-confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!pErr.confirm}
                aria-describedby={pErr.confirm ? 'profile-confirm-error' : undefined}
                {...passwords.register('confirm')}
              />
            </FormField>
            <Button type="submit" variant="outline" loading={savingPassword}>
              Change password
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
