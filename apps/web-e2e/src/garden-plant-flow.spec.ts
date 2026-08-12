import { expect, test } from '@playwright/test';

// The backend intentionally adds 200-2000ms of latency and a 10% chance of a 500 on every
// request (see apps/api/src/app/plugins/slow-api.ts and random-errors.ts). Non-idempotent
// writes (POST) aren't auto-retried by the app, so this test carries its own retries and a
// generous timeout rather than masking that behaviour.
test.describe.configure({ retries: 2 });
test.setTimeout(60_000);

test('create a garden, add a plant, and block overcrowding', async ({ page }) => {
  const gardenName = `E2E Garden ${Date.now()}`;

  await page.goto('/gardens');
  await page.getByRole('link', { name: 'New garden' }).click();

  await page.getByLabel('Name').fill(gardenName);
  await page.getByLabel('Total surface area (m²)').fill('10');
  await page.getByRole('button', { name: 'Create garden' }).click();

  await expect(page.getByRole('heading', { name: gardenName })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('10m² remaining')).toBeVisible();

  await page.getByRole('link', { name: 'Add your first plant' }).click();

  await page.getByLabel('Name').fill('Tomato');
  await page.getByLabel('Species').fill('Solanum lycopersicum');
  await page.getByLabel('Plantation date').fill('2026-01-01');
  await page.getByLabel('Ideal humidity level (%)').fill('60');

  // Overcrowd the 10m² garden on purpose: the live capacity meter should block the submit
  // button client-side, using the same rule the backend enforces.
  await page.getByLabel('Surface area required (m²)').fill('15');
  await expect(page.getByText(/would overcrowd the garden/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add plant' })).toBeDisabled();

  await page.getByLabel('Surface area required (m²)').fill('4');
  await expect(page.getByRole('button', { name: 'Add plant' })).toBeEnabled();
  await page.getByRole('button', { name: 'Add plant' }).click();

  await expect(page.getByRole('heading', { name: gardenName })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('4m² / 10m² used')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tomato' })).toBeVisible();
});
