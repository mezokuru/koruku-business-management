import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Settings } from '../types/database';
import toast from 'react-hot-toast';

// Fetch all settings
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key', { ascending: true });

      if (error) {
        throw new Error(error.message || 'Failed to fetch settings');
      }

      // Transform array of settings into a more usable object
      const settingsMap: Record<string, any> = {};
      data.forEach((setting: Settings) => {
        settingsMap[setting.key] = setting.value;
      });

      return {
        raw: data as Settings[],
        business_info: settingsMap.business_info,
        invoice_settings: settingsMap.invoice_settings,
        project_settings: settingsMap.project_settings,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
  });
}

// Update settings mutation
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { key: string; value: any }[]) => {
      // Update multiple settings in parallel
      const promises = updates.map(({ key, value }) =>
        supabase
          .from('settings')
          .upsert(
            { key, value },
            { onConflict: 'key' }
          )
          .select()
          .single()
      );

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(errors[0].error?.message || 'Failed to update settings');
      }

      return results.map(result => result.data as Settings);
    },
    onSuccess: () => {
      // Invalidate settings
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
