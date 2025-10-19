import type { paths } from '@/types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Fetch with authentication
 */
export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Get token from localStorage (set by Supabase)
  const token = localStorage.getItem('supabase.auth.token');

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Type-safe API paths
 */
export type ApiPaths = paths;
