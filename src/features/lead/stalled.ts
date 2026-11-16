import type { RosterRow } from '@/features/roster/api'

/** Days without activity after which an active student is flagged as stalled. */
export const STALLED_AFTER_DAYS = 7
const DAY = 86_400_000

/** Active students with no lesson or submission in the last week (or none since joining a week ago). */
export function stalledStudents(rows: RosterRow[], now = Date.now()) {
  return rows
    .filter((r) => r.status === 'active')
    .map((r) => ({ row: r, since: new Date(r.last_activity ?? r.joined_at).getTime() }))
    .filter(({ since }) => now - since >= STALLED_AFTER_DAYS * DAY)
    .sort((a, b) => a.since - b.since)
    .map(({ row, since }) => ({ ...row, idleDays: Math.floor((now - since) / DAY) }))
}
