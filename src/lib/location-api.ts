import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Missing Authorization header');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

interface CreateLocationRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  neighborhood?: string;
  geo?: {
    lat: number;
    lng: number;
  };
}

export const locationApi = {
  async list(): Promise<any> {
    return fetchWithAuth('/api/internal/locations');
  },

  async create(data: CreateLocationRequest): Promise<any> {
    return fetchWithAuth('/api/internal/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
