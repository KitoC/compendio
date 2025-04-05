import React, { useState, useEffect } from "react";
import { Check, ChevronDown, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
interface TenantOption {
  id: string;
  name: string;
  workspace: string;
  is_primary_tenant?: boolean;
}

const TenantSwitcher: React.FC = () => {
  const { tenantData, urlTenantAlias } = useTenant();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTenants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_user_tenants", {
          user_id: user.id,
        });
        if (error) {
          console.error("Error fetching tenants:", error);
          return;
        }

        setTenants(data || []);
      } catch (error) {
        console.error("Error fetching tenants:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleTenantSwitch = (workspace: string) => {
    if (workspace === urlTenantAlias) return;

    try {
      const redirectRoute = ROUTES.DASHBOARD.replace(":tenantId", workspace);
      navigate(redirectRoute);
      toast.success(`Switched to ${workspace}`);
    } catch (error) {
      console.error("Error switching tenant:", error);
      toast.error("Failed to switch tenant");
    }
  };

  if (!tenantData) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-dashed bg-background hover:bg-muted"
          disabled={isLoading || tenants.length <= 1}
        >
          <div className="flex items-center gap-2 text-left">
            <Building className="h-4 w-4" />
            <span className="truncate">
              {tenantData.name || tenantData.workspace}
            </span>
          </div>
          {tenants.length > 1 && <ChevronDown className="h-4 w-4 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            className="cursor-pointer"
            onClick={() => handleTenantSwitch(tenant.workspace)}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{tenant.name || tenant.workspace}</span>
              </div>
              {tenant.workspace === urlTenantAlias && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            navigate(ROUTES.INDEX);
            toast.success("Redirected to home page");
          }}
        >
          Create new workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TenantSwitcher;
