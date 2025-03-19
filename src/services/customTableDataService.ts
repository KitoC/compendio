
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionsUrl } from "@/utils/supabaseUtils";

interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string>;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// Service for interacting with custom table data
export const customTableDataService = {
  // Get data with pagination, filtering, and searching
  async getTableData(tableId: string, params: PaginationParams = {}): Promise<PaginatedResponse<any>> {
    try {
      const { 
        page = 1, 
        pageSize = 10, 
        sortField = 'created_at', 
        sortDirection = 'desc', 
        search = '',
        filters = {}
      } = params;
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        tableId,
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortField,
        sortDirection,
        search
      });
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(`filter[${key}]`, value);
      });
      
      const functionsUrl = getSupabaseFunctionsUrl();
      const response = await fetch(`${functionsUrl}/custom-table-data/get?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting table data:', error);
      throw error;
    }
  },
  
  // Get a single record by ID
  async getRecordById(id: string): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const functionsUrl = getSupabaseFunctionsUrl();
      const response = await fetch(`${functionsUrl}/custom-table-data/getById?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch record');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting record:', error);
      throw error;
    }
  },
  
  // Create a new record
  async createRecord(tableId: string, data: Record<string, any>): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const tenantId = session.data.session?.user.app_metadata.tenant_id;
      
      if (!token || !tenantId) {
        throw new Error('Authentication required');
      }
      
      const functionsUrl = getSupabaseFunctionsUrl();
      const response = await fetch(`${functionsUrl}/custom-table-data/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tableId, data, tenantId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create record');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  },
  
  // Update an existing record
  async updateRecord(id: string, tableId: string, data: Record<string, any>): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const functionsUrl = getSupabaseFunctionsUrl();
      const response = await fetch(`${functionsUrl}/custom-table-data/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, tableId, data })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update record');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },
  
  // Delete a record
  async deleteRecord(id: string): Promise<boolean> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const functionsUrl = getSupabaseFunctionsUrl();
      const response = await fetch(`${functionsUrl}/custom-table-data/delete?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete record');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};
