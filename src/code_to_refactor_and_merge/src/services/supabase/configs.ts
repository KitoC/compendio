import { SupabaseClient } from "@supabase/supabase-js/dist/module";

export type ConfigRecord = {
  domain: string;
  config: object;
  created_at?: string;
  updated_at?: string;
};

interface CreateConfigParams {
  domain: string;
  config: object;
}

interface UpdateConfigParams {
  domain: string;
  config: object;
}

export const makeConfigService = (supabase: SupabaseClient) => {
  // Create a new config record
  const createConfig = async ({
    domain,
    config,
  }: CreateConfigParams): Promise<ConfigRecord> => {
    const { error } = await supabase
      .from("configs")
      .insert({
        domain,
        config,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create config: ${error.message}`);
    }

    const { data } = await supabase
      .from("configs")
      .select()
      .eq("domain", domain)
      .maybeSingle();

    return data;
  };

  // Get a config by domain
  const getConfigByNameAndTenant = async (
    name: string,
    tenantID: string
  ): Promise<ConfigRecord | null> => {
    const { data, error } = await supabase
      .from("configs")
      .select("*")
      .eq("name", name)
      .eq("tenant_id", tenantID)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch config: ${error.message}`);
    }

    return data;
  };

  // Get all configs
  const getAllConfigs = async (): Promise<ConfigRecord[]> => {
    const { data, error } = await supabase
      .from("configs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch configs: ${error.message}`);
    }

    return data || [];
  };

  // Update an existing config
  const updateConfig = async ({
    domain,
    config,
  }: UpdateConfigParams): Promise<ConfigRecord> => {
    const { error } = await supabase
      .from("configs")
      .update({
        config,
        updated_at: new Date().toISOString(),
      })
      .eq("domain", domain)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update config: ${error.message}`);
    }

    const { data } = await supabase
      .from("configs")
      .select()
      .eq("domain", domain)
      .maybeSingle();

    return data;
  };

  // Delete a config
  const deleteConfig = async (domain: string): Promise<void> => {
    const { error } = await supabase
      .from("configs")
      .delete()
      .eq("domain", domain);

    if (error) {
      throw new Error(`Failed to delete config: ${error.message}`);
    }
  };

  return {
    create: createConfig,
    get: getConfigByNameAndTenant,
    getAll: getAllConfigs,
    update: updateConfig,
    delete: deleteConfig,
  };
};
