import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildTimeline } from '@/lib/timeline-utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useContactDetail(contactId: string) {
  const query = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/api/internal/contacts/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch contact');
      return response.json();
    },
    enabled: !!contactId,
  });

  const timeline = query.data ? buildTimeline(query.data) : [];

  return {
    contact: query.data,
    timeline,
    isLoading: query.isLoading,
    error: query.error,
  };
}
