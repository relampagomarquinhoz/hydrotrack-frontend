export const API_URL = 'https://dictate-polygon-little.ngrok-free.dev';

export const authFetch = async (path: string, token: string | null, options: RequestInit = {}) => {
  return fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};