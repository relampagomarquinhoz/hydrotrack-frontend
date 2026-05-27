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