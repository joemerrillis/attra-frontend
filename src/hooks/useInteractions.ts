import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface InteractionData {
  contact_id: string;
  interaction_type: 'phone_call' | 'meeting' | 'email' | 'door_knock';
  notes: string;
  outcome: 'interested' | 'not_home' | 'rejected' | 'follow_up_scheduled';
  follow_up_date?: string;
}

export function useInteractions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const logInteraction = useMutation({
    mutationFn: async (data: InteractionData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/api/internal/interactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to log interaction');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact', variables.contact_id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });

      toast({
        title: 'Interaction logged',
        description: 'Timeline updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to log interaction',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  return {
    logInteraction: logInteraction.mutate,
    isLogging: logInteraction.isPending,
  };
}
