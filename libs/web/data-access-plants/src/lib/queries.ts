import { plantResponseSchema, plantsResponseSchema } from '@itp-home-garden/shared-api-contracts';
import { apiUrl, resilientFetch } from '@itp-home-garden/web-api-client';
import { authHeaders } from '@itp-home-garden/web-data-access-auth';
import { plantsForGardenTag, plantTag } from './cache-tags.js';

const READ_RETRIES = 2;
const REVALIDATE_SECONDS = 60;

export async function getPlantsByGardenId(gardenId: number) {
  return resilientFetch(apiUrl(`/plants/garden/${gardenId}`), plantsResponseSchema, {
    headers: await authHeaders(),
    retries: READ_RETRIES,
    next: { tags: [plantsForGardenTag(gardenId)], revalidate: REVALIDATE_SECONDS },
  });
}

export async function getPlantById(plantId: number) {
  return resilientFetch(apiUrl(`/plants/${plantId}`), plantResponseSchema, {
    headers: await authHeaders(),
    retries: READ_RETRIES,
    next: { tags: [plantTag(plantId)], revalidate: REVALIDATE_SECONDS },
  });
}
