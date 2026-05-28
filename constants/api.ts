import { jwtDecode } from 'jwt-decode';

export const API_URL = 'https://hydrotrack-backend-2ucp.onrender.com';

export const authFetch = async (path: string, token: string | null, options: RequestInit = {}) => {
  return fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

export function getRoleFromToken(token: string): string {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.role || 'user';
  } catch {
    return 'user';
  }
}