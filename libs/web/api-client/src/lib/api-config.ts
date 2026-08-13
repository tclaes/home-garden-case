/**
 * Reads the backend location/token from the environment. Only ever called from server-side code
 * (Server Components, Server Actions) so the token never reaches the client bundle.
 */
export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://localhost:3000';
}

export function apiUrl(path: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${baseUrl}/${normalizedPath}`;
}
