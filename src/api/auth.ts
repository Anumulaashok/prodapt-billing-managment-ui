/**
 * Auth endpoint calls. Kept separate from client.ts because login happens
 * before a token exists, so it doesn't go through the authenticated
 * request primitive.
 */
import { API_BASE_URL, ApiError } from './client';

export interface LoginResponse {
  token: string;
  expiresAt: string;
}

/**
 * POST /1.0/kb/security/login
 * Body: { username, password }
 * Success (200): { token, expiresAt }
 * Failure: 401
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/1.0/kb/security/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Login failed');
  }

  return (await response.json()) as LoginResponse;
}
