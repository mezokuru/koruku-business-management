import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Activity, ActivityInput } from '../types/database';

// Fetch activities for an entity
export function useEntityActivities(entityType: string | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ['activities', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return [];
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!entityType && !!entityId,
  });
}

// Fetch all activities (recent)
export function useRecentActivities(limit: number = 50) {
  return useQuery({
    queryKey: ['activities', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Activity[];
    },
  });
}

// Log activity
export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: ActivityInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('activities')
        .insert([{ ...activity, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Activity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', data.entity_type, data.entity_id] });
    },
    // Silent - don't show toast for activity logging
  });
}

// Helper function to log activity (can be called directly)
export async function logActivity(
  entityType: Activity['entity_type'],
  entityId: string,
  action: Activity['action'],
  description: string,
  metadata?: Record<string, any>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('activities').insert([{
    entity_type: entityType,
    entity_id: entityId,
    action,
    description,
    metadata,
    user_id: user.id,
  }]);
}
