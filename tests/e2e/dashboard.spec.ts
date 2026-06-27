import { expect, test } from '@playwright/test'

test('shows the local-first dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Solde actuel')).toBeVisible()
  await expect(page.getByText('Dépenses récentes')).toBeVisible()
})
