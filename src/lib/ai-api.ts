import { fetchWithAuth } from './api-client';

type GenerateCopyRequest = any;
type GenerateCopyResponse = any;

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
