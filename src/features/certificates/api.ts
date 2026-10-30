import { supabase } from '@/lib/supabase'
import type { Certificate } from '@/types/domain'

export const certKeys = {
  mine: (userId: string) => ['certificate', 'mine', userId] as const,
  verify: (no: string) => ['certificate', 'verify', no] as const,
  admin: ['certificate', 'admin'] as const,
  signatories: ['certificate', 'signatories'] as const,
  all: ['certificate'] as const,
}

export async function listMyCertificates(userId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })
  if (error) throw error
  return data as Certificate[]
}

export const signatureUrl = (path: string) =>
  supabase.storage.from('signatures').getPublicUrl(path).data.publicUrl

/** A data URL for a signature image, or null if it cannot be fetched. */
export async function loadSignatureDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(signatureUrl(path))
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export interface Verification {
  certificate_no: string
  status: 'valid' | 'revoked'
  student_name: string
  stack_name: string
  issued_at: string
  revoked_at: string | null
}

export async function verifyCertificate(number: string): Promise<Verification | null> {
  const { data, error } = await supabase.rpc('verify_certificate', { p_number: number })
  if (error) throw error
  const rows = (data ?? []) as Verification[]
  return rows[0] ?? null
}

export async function sendCertificateEmail(certificateId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-certificate-email', {
    body: { certificate_id: certificateId },
  })
  if (error) throw error
}

// ------------------------------------------------------------ admin

export interface AdminCertificate extends Certificate {
  profiles: { email: string } | null
}

export async function listAllCertificates(): Promise<AdminCertificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles(email)')
    .order('issued_at', { ascending: false })
  if (error) throw error
  return data as unknown as AdminCertificate[]
}

export async function revokeCertificate(id: string, reason: string) {
  const { error } = await supabase.rpc('revoke_certificate', { p_id: id, p_reason: reason })
  if (error) throw error
}

export async function reissueCertificate(id: string) {
  const { error } = await supabase.rpc('reissue_certificate', { p_id: id })
  if (error) throw error
}

export interface Signatory {
  id: string
  name: string
  title: string
  signature_path: string | null
  display_order: number
  is_active: boolean
}

export async function listSignatories(): Promise<Signatory[]> {
  const { data, error } = await supabase
    .from('certificate_signatories')
    .select('*')
    .order('display_order')
    .order('created_at')
  if (error) throw error
  return data as Signatory[]
}

export interface SignatoryInput {
  name: string
  title: string
  display_order: number
  signature_path: string | null
}

export async function saveSignatory(input: SignatoryInput, id?: string) {
  const { error } = id
    ? await supabase.from('certificate_signatories').update(input).eq('id', id)
    : await supabase.from('certificate_signatories').insert(input)
  if (error) throw error
}

export async function setSignatoryActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('certificate_signatories')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

/**
 * Signature files are never deleted or overwritten: certificates already issued keep pointing at them.
 * A replacement is simply a new file.
 */
export async function uploadSignature(file: File): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-60)
  const path = `${crypto.randomUUID()}-${safe}`
  const { error } = await supabase.storage
    .from('signatures')
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}
