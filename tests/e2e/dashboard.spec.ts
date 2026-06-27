import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('shows the local-first dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
  await page.getByRole('button', { name: 'Créer un compte' }).click()
  await page.getByLabel('Nom').fill('Utilisateur E2E')
  await page.getByLabel('Email').fill(`e2e-${randomUUID()}@example.test`)
  await page.getByLabel('Mot de passe').fill('mot-de-passe-e2e')
  await page.getByRole('button', { name: "S'inscrire" }).click()

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Solde actuel')).toBeVisible()
  await expect(page.getByText('Dépenses récentes')).toBeVisible()
})
