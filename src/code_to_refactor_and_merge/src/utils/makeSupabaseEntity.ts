import { get } from "lodash";
import supabaseManager from "../lib/supabase";

function makeSupabaseEntity<EntityType, EntityParams>({
  entityName,
  primaryKey = "id",
}: {
  entityName: string;
  primaryKey?: string;
}) {
  const supabase = supabaseManager.getClient();
  // Create a new entity record
  const create = async (params: EntityParams): Promise<EntityType> => {
    const { error } = await supabase
      .from(entityName)
      .insert({ ...params, tenant_id: supabaseManager.tenantId })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${entityName}: ${error.message}`);
    }

    const { data } = await supabase
      .from(entityName)
      .select()
      .eq(primaryKey, get(params, primaryKey))
      .eq("tenant_id", supabaseManager.tenantId)
      .maybeSingle();

    return data;
  };

  // Get a entity by id
  const getById = async (id: string): Promise<EntityType | null> => {
    const { data, error } = await supabase
      .from(entityName)
      .select("*")
      .eq(primaryKey, id)
      .eq("tenant_id", supabaseManager.tenantId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch ${entityName}: ${error.message}`);
    }

    return data;
  };

  // Get all entities
  const getMany = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modifier: (chain: any) => any
  ): Promise<EntityType[]> => {
    const { data, error } = await modifier(
      supabase
        .from(entityName)
        .select("*")
        .eq("tenant_id", supabaseManager.tenantId)
    );

    if (error) {
      throw new Error(
        `Failed to fetch list of ${entityName}: ${error.message}`
      );
    }

    return data || [];
  };

  // Update an existing entity
  const update = async (
    id: string,
    params: EntityParams
  ): Promise<EntityType> => {
    const { error } = await supabase
      .from(entityName)
      .update({ ...params, tenant_id: supabaseManager.tenantId })
      .eq(primaryKey, id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${entityName}: ${error.message}`);
    }

    const { data } = await supabase
      .from(entityName)
      .select()
      .eq(primaryKey, id)
      .eq("tenant_id", supabaseManager.tenantId)
      .maybeSingle();

    return data;
  };

  const upsert = async (params: EntityParams): Promise<EntityType> => {
    if (!get(params, primaryKey)) {
      throw new Error(`No Primary key (${primaryKey}) provided`);
    }

    const { error: upsertError } = await supabase
      .from(entityName)
      .upsert({ ...params, tenant_id: supabaseManager.tenantId })
      .select()
      .single();

    if (upsertError) {
      await update(get(params, primaryKey), params);
    }

    const { data } = await supabase
      .from(entityName)
      .select()
      .eq(primaryKey, get(params, primaryKey))
      .eq("tenant_id", supabaseManager.tenantId)
      .maybeSingle();

    return data;
  };

  // Delete a entity
  const deleteEntity = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(entityName)
      .delete()
      .eq(primaryKey, id)
      .eq("tenant_id", supabaseManager.tenantId);

    if (error) {
      throw new Error(`Failed to delete ${entityName}: ${error.message}`);
    }
  };

  return {
    create,
    getById,
    getMany,
    update,
    upsert,
    delete: deleteEntity,
  };
}

export default makeSupabaseEntity;
