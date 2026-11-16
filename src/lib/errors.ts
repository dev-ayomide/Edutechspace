interface PostgrestLike {
  code?: string
  message?: string
}

/** Turns a Supabase/Postgres error into a message that is safe and useful to show a user. */
export function friendlyError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const e = (error ?? {}) as PostgrestLike
  switch (e.code) {
    case '42501':
      return 'You do not have permission to do that.'
    case '23505':
      return 'That already exists.'
    case '23503':
      return 'That item is linked to something that no longer exists.'
    case '23514':
      return e.message?.includes('published_lesson_has_content')
        ? 'A published lesson needs its content. Add a link, a file or text first.'
        : 'Some of the values are not allowed. Please check the form.'
    case 'P0001':
    case '02000':
      return e.message ?? fallback
  }
  // Messages raised on purpose by our own database functions are written for users.
  if (
    e.message &&
    /^(Admins only|Application|Only |This |An active|You cannot|The list|Unknown|Not allowed)/.test(
      e.message,
    )
  ) {
    return e.message
  }
  return fallback
}

/** Supabase Auth refuses some new passwords with a reason code; say which rule was broken. */
export function passwordChangeError(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code
  if (code === 'same_password') return 'That is your current password. Choose a new one.'
  if (code === 'weak_password') return 'That password is too easy to guess. Try a longer one.'
  return fallback
}
