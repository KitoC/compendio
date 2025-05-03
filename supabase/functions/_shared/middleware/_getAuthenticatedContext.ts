import { getADMINClient } from "@/db";
import { getClient } from "@/db";
import { ServiceError } from "@/error-types";
import { AuthService } from "@/services/AuthService";
import Logger from "@/utils/Logger";
import { getSharedServices } from "@/middleware/_getSharedServices";
import { AirtableService } from "@/services/providers/AirtableService";
import { BaserowService } from "@/services/providers/BaserowService";
const logger = new Logger({ name: "AuthenticatedContext" });

export const getAuthenticatedContext = async (
  Authorization?: string | null,
  tenantId?: string | null,
  debug?: boolean
) => {
  if (!Authorization) {
    throw new ServiceError(
      "withAuthenticatedContext",
      "Authorization header is required",
      401
    );
  }

  const supabase_AS_SUPER_ADMIN = getADMINClient();
  const supabase = getClient(Authorization);

  const supabaseContext = {
    supabase,
    supabase_AS_SUPER_ADMIN,
  };

  const authService = new AuthService(
    supabaseContext,
    Authorization || undefined,
    tenantId || undefined
  );

  await authService.initialize();
  const user = await authService.getUser();

  logger.info("🟢 AUTHENTICATED");
  logger.debug("currentUser", user?.user?.id);
  logger.debug("tenantId", tenantId);

  const tenantWorkspace = await supabase_AS_SUPER_ADMIN
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  logger.debug("tenantWorkspace", tenantWorkspace.data);
  const airtableService = new AirtableService(tenantWorkspace.data.base_id);
  const baserowService = new BaserowService(tenantWorkspace.data.base_id);

  return {
    ...supabaseContext,
    authService,
    user,
    tenant_id: tenantId,
    ...getSharedServices(supabaseContext),
    airtableService,
    baserowService,
  };
};
