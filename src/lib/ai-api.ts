type GenerateCopyRequest = any;
type GenerateCopyResponse = any;

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
    const error = await response.json().catch(() => ({ error: 'AI request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const aiApi = {
  async generateCopy(data: GenerateCopyRequest): Promise<GenerateCopyResponse> {
    return fetchWithAuth('/api/internal/ai/generate-copy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkRateLimit() {
    return fetchWithAuth('/api/internal/ai/rate-limit');
  },
};
