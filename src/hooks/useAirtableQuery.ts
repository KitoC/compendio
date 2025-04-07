
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AirtableBaseSchemaResponse, AirtableTable, AirtableBase } from "@/types/airtable";
import { AirtableRecord } from "@/components/airtable-table/types";
import { toast } from "sonner";

interface UseAirtableQueryOptions {
  baseId?: string;
  tableName?: string;
  enableRealtime?: boolean;
}

/**
 * Hook to fetch Airtable base schema 
 */
export const useAirtableBaseQuery = (baseId?: string) => {
  return useQuery({
    queryKey: ['airtable', 'base', baseId],
    queryFn: async () => {
      if (!baseId) {
        throw new Error('Base ID is required');
      }
      
      const response = await supabase.functions.invoke('table-schema', {
        body: { baseId },
      });
      
      if (response.error) {
        throw new Error(`Failed to fetch Airtable schema: ${response.error.message}`);
      }
      
      return response.data as AirtableBase;
    },
    enabled: !!baseId,
  });
};

/**
 * Hook to fetch Airtable table records
 */
export const useAirtableRecordsQuery = (
  { baseId, tableName, enableRealtime = false }: UseAirtableQueryOptions = {}
) => {
  const { data: records, ...queryResults } = useQuery({
    queryKey: ['airtable', 'records', baseId, tableName],
    queryFn: async () => {
      if (!baseId || !tableName) {
        throw new Error('Base ID and table name are required');
      }
      
      const response = await supabase.functions.invoke('table-records', {
        body: { baseId },
        query: { table: tableName },
      });
      
      if (response.error) {
        throw new Error(`Failed to fetch Airtable records: ${response.error.message}`);
      }
      
      return response.data as AirtableRecord[];
    },
    enabled: !!baseId && !!tableName,
  });

  // Mutations for CRUD operations
  const createRecord = async (fields: Record<string, any>) => {
    try {
      const response = await supabase.functions.invoke('table-records', {
        body: { fields, baseId },
        query: { table: tableName },
        method: 'POST',
      });
      
      if (response.error) {
        throw new Error(`Failed to create record: ${response.error.message}`);
      }
      
      toast.success('Record created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error('Failed to create record');
      throw error;
    }
  };

  const updateRecord = async (id: string, fields: Record<string, any>) => {
    try {
      const response = await supabase.functions.invoke('table-records', {
        body: { fields, baseId },
        query: { table: tableName, recordId: id },
        method: 'PATCH',
      });
      
      if (response.error) {
        throw new Error(`Failed to update record: ${response.error.message}`);
      }
      
      toast.success('Record updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record');
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const response = await supabase.functions.invoke('table-records', {
        query: { table: tableName, recordId: id, baseId },
        method: 'DELETE',
      });
      
      if (response.error) {
        throw new Error(`Failed to delete record: ${response.error.message}`);
      }
      
      toast.success('Record deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
      throw error;
    }
  };

  return {
    ...queryResults,
    records,
    createRecord,
    updateRecord,
    deleteRecord,
  };
};
