import { getADMINClient } from "locals/db";
import { getClient } from "locals/db";
import { ServiceError } from "locals/error-types";
import { AuthService } from "locals/services/AuthService";
import Logger from "locals/utils/Logger";
import { getSharedServices } from "locals/middleware/_getSharedServices";

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

  console.log("🟢 AUTHENTICATED");

  logger.debug("currentUser", user?.user?.id);
  logger.debug("tenantId", tenantId);

  return {
    ...supabaseContext,
    authService,
    user,
    tenant_id: tenantId,
    ...getSharedServices(supabaseContext),
  };
};
