import { gardenResponseSchema, gardensResponseSchema } from '@itp-home-garden/shared-api-contracts';
import { apiUrl, resilientFetch } from '@itp-home-garden/web-api-client';
import { authHeaders } from '@itp-home-garden/web-data-access-auth';
import { GARDENS_LIST_TAG, gardenTag } from './cache-tags.js';

/** Reads retry automatically — GET is idempotent, so retrying the flaky backend is safe. */
const READ_RETRIES = 2;
/** A safety-net revalidation window on top of tag-based invalidation, in case a mutation happens
 * through another client (e.g. Bruno, another tab) that doesn't go through our Server Actions. */
const REVALIDATE_SECONDS = 60;

export async function getGardens() {
  return resilientFetch(apiUrl('/gardens'), gardensResponseSchema, {
    headers: await authHeaders(),
    retries: READ_RETRIES,
    next: { tags: [GARDENS_LIST_TAG], revalidate: REVALIDATE_SECONDS },
  });
}

export async function getGardenById(gardenId: number) {
  return resilientFetch(apiUrl(`/gardens/${gardenId}`), gardenResponseSchema, {
    headers: await authHeaders(),
    retries: READ_RETRIES,
    next: { tags: [gardenTag(gardenId)], revalidate: REVALIDATE_SECONDS },
  });
}
