import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import RequestController, {
  RequestError,
} from "locals/controllers/RequestController";
import SupabaseController, {
  ROLES,
} from "locals/controllers/SupabaseController";

serve(async (req: Request) => {
  try {
    RequestController.sendPreflightResponse();

    RequestController.checkAuthHeaderPresent(req);

    await SupabaseController.initialize(req, true);

    SupabaseController.requireRole(ROLES.ADMIN);

    return RequestController.sendJsonResponse({ success: "wohoo" }, 200);
  } catch (error: unknown) {
    return RequestController.sendError(error as RequestError);
  }
});
