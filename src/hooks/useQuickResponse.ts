import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useQuickResponse(contactId: string) {
  const { toast } = useToast();

  const getComposeUrl = async (templateId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const url = `${API_BASE}/api/internal/gmail/quick-response/${contactId}/compose-url${
      templateId ? `?templateId=${templateId}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  };

  const trackResponse = useMutation({
    mutationFn: async (templateId?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${API_BASE}/api/internal/gmail/quick-response/${contactId}/track-opened`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ template_id: templateId }),
        }
      );

      if (!response.ok) throw new Error('Failed to track response');
      return response.json();
    },
  });

  const openGmailCompose = async (templateId?: string) => {
    try {
      // Get compose URL
      const { composeUrl, preview } = await getComposeUrl(templateId);

      // Track that user clicked "Respond"
      await trackResponse.mutateAsync(templateId);

      // Open Gmail in new tab
      window.open(composeUrl, '_blank');

      toast({
        title: 'Gmail opened',
        description: `Template loaded. Response time: ${preview.responseTime || 'calculating'}`,
      });
    } catch (error: any) {
      if (error.error === 'Response limit reached') {
        toast({
          title: 'Upgrade required',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to open Gmail',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    }
  };

  return {
    openGmailCompose,
    isTracking: trackResponse.isPending,
  };
}
