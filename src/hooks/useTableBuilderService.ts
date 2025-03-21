import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseFunctionsUrl } from "@/utils/supabaseUtils";
import { toast } from "sonner";

export interface TableSchema {
  tables: Array<{
    name: string;
    display_name: string;
    description: string;
    fields: Array<{
      name: string;
      display_name: string;
      field_type: string;
      description: string;
      is_required: boolean;
      is_unique: boolean;
      default_value?: any;
      options?: string[];
    }>;
  }>;
  relationships: Array<{
    from_table: string;
    from_field: string;
    to_table: string;
    to_field: string;
    relationship_type: string;
  }>;
  explanation: string;
}

export interface FileContent {
  name: string;
  content: string;
}

export interface ImportResult {
  success: boolean;
  table_ids: Record<string, string>;
  import_results: Record<string, number>;
  message: string;
}

export const useTableBuilderService = () => {
  const { user, tenantId } = useAuth();

  const callEdgeFunction = async (
    action: string,
    params: Record<string, any>
  ) => {
    try {
      const { data } = await supabase.auth.getSession();
      console.log("SESSION", data?.session?.access_token);
      const token = data?.session?.access_token;

      if (!token) {
        throw new Error("Authentication required");
      }

      const functionsUrl = getSupabaseFunctionsUrl();
      const response = await fetch(`${functionsUrl}/table-builder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to call table builder");
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in table builder (${action}):`, error);
      toast.error(`Table builder error: ${error.message}`);
      throw error;
    }
  };

  const generateSchema = async (prompt: string): Promise<TableSchema> => {
    const result = await callEdgeFunction("generate_schema", { prompt });
    return result.schema as TableSchema;
  };

  const analyzeFiles = async (files: FileContent[]): Promise<TableSchema> => {
    const result = await callEdgeFunction("analyze_files", { files });
    return result.schema as TableSchema;
  };

  const createTables = async (
    schema: TableSchema
  ): Promise<Record<string, string>> => {
    const result = await callEdgeFunction("create_tables", { schema });
    return result.table_ids as Record<string, string>;
  };

  const importData = async (
    schema: TableSchema,
    files: FileContent[]
  ): Promise<ImportResult> => {
    return callEdgeFunction("import_data", {
      schema,
      files,
    }) as Promise<ImportResult>;
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const processFiles = async (files: File[]): Promise<FileContent[]> => {
    const fileContents: FileContent[] = [];

    for (const file of files) {
      try {
        const content = await readFileAsText(file);
        fileContents.push({
          name: file.name,
          content,
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        toast.error(`Failed to read file: ${file.name}`);
      }
    }

    return fileContents;
  };

  return {
    generateSchema,
    analyzeFiles,
    createTables,
    importData,
    processFiles,
  };
};
