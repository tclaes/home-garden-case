import { plantResponseSchema, plantsResponseSchema } from '@itp-home-garden/shared-api-contracts';
import { apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';
import { userHeaders } from '@itp-home-garden/web-data-access-gardens/user-context';

const READ_RETRIES = 2;

export async function getPlantsByGardenId(gardenId: number) {
  return resilientFetch(apiUrl(`/plants/garden/${gardenId}`), plantsResponseSchema, {
    headers: { ...authHeaders(), ...(await userHeaders()) },
    retries: READ_RETRIES,
    cache: 'no-store',
  });
}

export async function getPlantById(plantId: number) {
  return resilientFetch(apiUrl(`/plants/${plantId}`), plantResponseSchema, {
    headers: { ...authHeaders(), ...(await userHeaders()) },
    retries: READ_RETRIES,
    cache: 'no-store',
  });
}
