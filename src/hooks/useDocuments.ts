import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Document, DocumentInput } from '../types/database';
import { toast } from 'react-hot-toast';

// Fetch documents for an entity
export function useEntityDocuments(entityType: string | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!entityType && !!entityId,
  });
}

// Fetch all documents
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
  });
}

// Upload document
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: Omit<DocumentInput, 'file_path' | 'file_size' | 'file_type'> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...metadata,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) {
        // Cleanup uploaded file if database insert fails
        await supabase.storage.from('documents').remove([filePath]);
        throw error;
      }

      return data as Document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (data.entity_type && data.entity_id) {
        queryClient.invalidateQueries({ queryKey: ['documents', data.entity_type, data.entity_id] });
      }
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
}

// Update document metadata
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DocumentInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (data.entity_type && data.entity_id) {
        queryClient.invalidateQueries({ queryKey: ['documents', data.entity_type, data.entity_id] });
      }
      toast.success('Document updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update document: ${error.message}`);
    },
  });
}

// Delete document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get document details before deleting
      const { data: document } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (!document) throw new Error('Document not found');

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return document;
    },
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (document.entity_type && document.entity_id) {
        queryClient.invalidateQueries({ queryKey: ['documents', document.entity_type, document.entity_id] });
      }
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}

// Get document download URL
export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (!data) throw new Error('Failed to get document URL');
  return data.signedUrl;
}
