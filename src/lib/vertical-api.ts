const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
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
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

interface CreateTenantVerticalRequest {
  tenant_id: string;
  vertical_key: string;
  language_config: {
    name: string;
    audience: string;
    tone: string;
  };
}

export const verticalApi = {
  async createTenantVertical(data: CreateTenantVerticalRequest): Promise<any> {
    return fetchWithAuth('/api/internal/tenant-verticals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
