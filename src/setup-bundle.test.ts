import { execFileSync } from 'node:child_process'

describe('supabase/setup/all-migrations.sql', () => {
  it('matches the migrations exactly (regenerate with `npm run setup:sql`)', () => {
    expect(() =>
      execFileSync('node', ['scripts/build-setup-sql.mjs', '--check'], { stdio: 'pipe' }),
    ).not.toThrow()
  })
})
