import { expect, test } from '@playwright/test'

test('public home renders and links to sign in', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Learn\.\s*Grow\.\s*Build\./ })).toBeVisible()
  await page.getByRole('link', { name: 'Sign in' }).first().click()
  await expect(page).toHaveURL(/\/login$/)
})

test('signed-out visitors are redirected away from role areas', async ({ page }) => {
  for (const path of ['/admin', '/lead', '/dashboard']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
  }
})

test('login form validates required fields', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Enter your email')).toBeVisible()
})
