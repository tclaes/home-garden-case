import { gardenResponseSchema, gardensResponseSchema } from '@itp-home-garden/shared-api-contracts';
import { apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';
import { userHeaders } from './user-context.js';

/** Reads retry automatically — GET is idempotent, so retrying the flaky backend is safe. */
const READ_RETRIES = 2;

export async function getGardens() {
  return resilientFetch(apiUrl('/gardens'), gardensResponseSchema, {
    headers: { ...authHeaders(), ...(await userHeaders()) },
    retries: READ_RETRIES,
    cache: 'no-store',
  });
}

export async function getGardenById(gardenId: number) {
  return resilientFetch(apiUrl(`/gardens/${gardenId}`), gardenResponseSchema, {
    headers: { ...authHeaders(), ...(await userHeaders()) },
    retries: READ_RETRIES,
    cache: 'no-store',
  });
}
