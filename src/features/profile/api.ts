import { supabase } from '@/lib/supabase'

export async function saveContactDetails(userId: string, fullName: string, phone: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim(), phone: phone.trim() || null })
    .eq('id', userId)
  if (error) throw error
}
