import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TenantContext } from "./TenantContext";
import { ROUTES } from "@/lib/constants";
import { Database } from "@/integrations/supabase/types";
import Loader from "@/components/ui/loader";
import { uniqueNamesGenerator, colors, Config } from "unique-names-generator";
import { v4 as uuidv4 } from "uuid";
import { dynamicHeaders } from "@/integrations/supabase/client"; // wherever it's defined

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { tenantId: urlTenantAlias } = useParams<{ tenantId: string }>();
  const location = useLocation();

  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(
    location.pathname === ROUTES.ONBOARDING
  );
  const [isCreatingTenant, setIsCreatingTenant] = useState<boolean>(false);

  const [tenantData, setTenantData] = useState<
    Database["public"]["Tables"]["tenants"]["Row"] | null
  >(null);
  const [hasTenantAccess, setHasTenantAccess] = useState<boolean>(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [tenantOwnerId, setTenantOwnerId] = useState<string | null>(null);
  const [isTenantOwner, setIsTenantOwner] = useState<boolean>(false);
  const [hasRedirected, setHasRedirected] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasCheckedForTenants, setHasCheckedForTenants] =
    useState<boolean>(false);
  const navigate = useNavigate();

  const fetchOwnTenants = useCallback(async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("tenant_owner_id", user.id);

    if (error) {
      console.error("Error fetching own tenants:", error);
    }

    return data;
  }, [user]);

  const fetchAliasedTenant = useCallback(async (workspace) => {
    if (!workspace) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("workspace", workspace)
        .single();

      if (error) {
        toast.error("Unable to find tenant workspace");
        return;
      }

      return data;
    } catch (error) {
      console.error("Error in tenant lookup:", error);
    }
  }, []);

  const createNewTenant = useCallback(async () => {
    const config: Config = {
      dictionaries: [["fuzzy"], colors, ["koala"], [uuidv4().split("-")[0]]],
      separator: "-",
      seed: Math.random().toString(36).substring(2, 15),
    };

    const nameFromSeed: string = uniqueNamesGenerator(config);

    try {
      const { data, error } = await supabase
        .from("tenants")
        .insert({
          name: nameFromSeed,
          workspace: nameFromSeed,
          tenant_owner_id: user.id,
        })
        .select("*")
        .single();

      navigate(ROUTES.ONBOARDING.replace(":tenantId", data.workspace));
      setTenantData(data);
      setHasTenantAccess(true);
      setIsTenantOwner(true);
      setTenantOwnerId(user.id);
    } catch (error) {
      toast.error("Unable to create tenant");
      console.error("Error in tenant lookup:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [user, navigate]);

  const checkTenantAccess = useCallback(
    async (id: string) => {
      if (tenantData) {
        return;
      }

      try {
        // Check if user has a pending request
        const { data: pendingRequest, error: pendingError } = await supabase
          .from("tenant_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", id)
          .eq("status", "pending")
          .single();

        return pendingRequest;
      } catch (error) {
        console.error("Error checking tenant access:", error);
      }
    },
    [user, tenantData]
  );

  const fetchUserTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_user_tenants", {
        user_id: user.id,
      });

      if (error) {
        console.error("Error fetching owner tenant:", error);
        return;
      }

      return data;
    } catch (error) {
      console.error("Error fetching primary tenant:", error);
    }
  }, [user]);

  const getCurrentTenant = useCallback(async () => {
    try {
      if (tenantData) return;

      setIsLoading(true);

      let tenant = null;

      const userTenants = await fetchUserTenants();

      const primaryTenant = userTenants.find((t) => t.is_primary_tenant);

      tenant = primaryTenant;

      if (urlTenantAlias) {
        tenant = await fetchAliasedTenant(urlTenantAlias);
      }

      if (!urlTenantAlias) {
        const ownTenants = await fetchOwnTenants();

        if (ownTenants.length > 0) {
          setTenantData(ownTenants[0]);
          setHasTenantAccess(true);
          setIsTenantOwner(true);
          setTenantOwnerId(user.id);
        }
      }

      const isOwner = tenant?.tenant_owner_id === user.id;

      if (!isOwner) {
        const pendingRequest = await checkTenantAccess(tenant.id);

        if (pendingRequest) {
          setHasPendingRequest(true);
          setHasTenantAccess(false);
        }
      }

      if (tenant) {
        setTenantData(tenant);
        setHasTenantAccess(true);

        if (isOwner) {
          setTenantOwnerId(tenant.id);
          setIsTenantOwner(true);
        }
      }
    } catch (error) {
      console.error("Error fetching current tenant:", error);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
      setHasCheckedForTenants(true);
    }
  }, [
    tenantData,
    urlTenantAlias,
    fetchUserTenants,
    fetchAliasedTenant,
    user,
    checkTenantAccess,
    fetchOwnTenants,
  ]);

  useEffect(() => {
    if (!user) return;
    if (isLoaded) return;
  }, [getCurrentTenant, user, isLoading, isLoaded, location, createNewTenant]);

  useEffect(() => {
    if (!user) return;
    if (isLoading) return;
    if (isLoaded) return;

    getCurrentTenant();
  }, [getCurrentTenant, user, isLoading, isLoaded, location]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!hasCheckedForTenants) return;
    if (hasRedirected) return;

    // TODO: Uncomment this when we have finished the onboarding flow
    // if (!profile.is_onboarded) {
    //   navigate(ROUTES.ONBOARDING.replace(":tenantId", tenantData?.workspace));
    //   return;
    // }
    if (isCreatingTenant) {
      return;
    }

    if (hasTenantAccess) {
      let redirectPath = ROUTES.DASHBOARD.replace(
        ":tenantId",
        tenantData?.workspace
      );

      const isSameTenantPath = new RegExp(`/${tenantData?.workspace}/app(.*)`);

      if (isSameTenantPath.test(location.pathname)) {
        redirectPath = location.pathname;
        if (location.search) {
          redirectPath += location.search;
        }
      }

      navigate(redirectPath);
      setHasRedirected(true);
      return;
    }

    if (hasPendingRequest) {
      navigate(ROUTES.ACCESS_PENDING.replace(":tenantId", tenantData?.id));
      setHasRedirected(true);
      return;
    }

    if (
      (!hasTenantAccess || !hasPendingRequest) &&
      !isCreatingTenant &&
      !location.pathname.includes("/app")
    ) {
      setIsCreatingTenant(true);
      createNewTenant();
      return;
    }

    //  TODO: Handle tenant change
  }, [
    hasPendingRequest,
    hasTenantAccess,
    location.pathname,
    navigate,
    tenantData,
    urlTenantAlias,
    user,
    isLoading,
    fetchAliasedTenant,
    createNewTenant,
    isCreatingTenant,
    hasCheckedForTenants,
    profile,
    location,
  ]);

  useEffect(() => {
    if (tenantData) {
      dynamicHeaders["x-tenant-id"] = tenantData.id;
    }
  }, [tenantData]);

  const contextValue = {
    tenantId: tenantData?.id,
    urlTenantAlias: urlTenantAlias || tenantData?.workspace,
    tenantData,
    isLoading,
    hasTenantAccess,
    hasPendingRequest,
    tenantOwnerId,
    hasTenantInUrl: !!urlTenantAlias,
    isTenantOwner,
    fetchAliasedTenant,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
