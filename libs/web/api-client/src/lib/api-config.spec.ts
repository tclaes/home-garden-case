import { afterEach, describe, expect, it } from 'vitest';
import { apiUrl } from './api-config.js';

describe('apiUrl', () => {
  const originalBaseUrl = process.env.API_BASE_URL;

  afterEach(() => {
    process.env.API_BASE_URL = originalBaseUrl;
  });

  it('joins a base URL and a leading-slash path with exactly one slash', () => {
    process.env.API_BASE_URL = 'http://localhost:3000';
    expect(apiUrl('/gardens')).toBe('http://localhost:3000/gardens');
  });

  it('joins a base URL and a path without a leading slash', () => {
    process.env.API_BASE_URL = 'http://localhost:3000';
    expect(apiUrl('gardens')).toBe('http://localhost:3000/gardens');
  });

  it('does not duplicate the slash when the base URL has a trailing slash', () => {
    process.env.API_BASE_URL = 'http://localhost:3000/';
    expect(apiUrl('/gardens')).toBe('http://localhost:3000/gardens');
  });
});
