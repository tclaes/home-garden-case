import { APIRequestContext, expect, test } from '@playwright/test';

// The backend intentionally adds 200-2000ms of latency and a 10% chance of a 500 on every
// request (see apps/api/src/app/plugins/slow-api.ts and random-errors.ts). Non-idempotent
// writes (POST) aren't auto-retried by the app, so this test carries its own retries and a
// generous timeout rather than masking that behaviour.
test.describe.configure({ retries: 2 });
test.setTimeout(60_000);

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

/** Cleanup calls are just as exposed to the backend's injected flakiness as the test itself, so
 * they get their own small retry budget rather than silently leaving test data behind. */
async function deleteWithRetry(
  request: APIRequestContext,
  url: string,
  headers?: Record<string, string>,
  retries = 2,
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await request.delete(url, { headers });
    if (response.ok() || response.status() === 404) {
      return;
    }
  }
}

test('create a garden, add a plant, and block overcrowding', async ({ page, request }) => {
  const emailAddress = `e2e-${Date.now()}@example.com`;
  const gardenName = `E2E Garden ${Date.now()}`;
  let userId: string | undefined;
  let gardenId: string | undefined;

  try {
    await page.goto('/register');
    await page.getByLabel('Email address').fill(emailAddress);
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/login');
    await page.getByLabel('Email address').fill(emailAddress);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL('/gardens', { timeout: 15_000 });

    userId = (await page.context().cookies()).find(
      (cookie) => cookie.name === 'session_user_id',
    )?.value;

    await page.getByRole('link', { name: 'New garden' }).click();

    await page.getByLabel('Name').fill(gardenName);
    await page.getByLabel('Total surface area (m²)').fill('10');
    await page.getByRole('button', { name: 'Create garden' }).click();

    await expect(page.getByRole('heading', { name: gardenName })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('10m² remaining')).toBeVisible();
    gardenId = page.url().match(/\/gardens\/(\d+)/)?.[1];

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
  } finally {
    // Delete plants before the garden: the garden/plant FK has an onDelete('cascade') in the
    // schema, but SQLite foreign key enforcement isn't turned on for this connection, so a
    // deleted garden's plants wouldn't actually be cleaned up without this.
    if (userId && gardenId) {
      const headers = { 'X-User-Id': userId };
      const plantsResponse = await request
        .get(`${API_BASE_URL}/plants/garden/${gardenId}`, { headers })
        .catch(() => undefined);
      if (plantsResponse?.ok()) {
        const plants: { plantId: number }[] = await plantsResponse.json();
        for (const plant of plants) {
          await deleteWithRetry(request, `${API_BASE_URL}/plants/${plant.plantId}`, headers);
        }
      }
      await deleteWithRetry(request, `${API_BASE_URL}/gardens/${gardenId}`, headers);
    }
    if (userId) {
      await deleteWithRetry(request, `${API_BASE_URL}/users/${userId}`);
    }
  }
});
