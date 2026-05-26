export const API_URL = 'http://10.0.2.2:3000';

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