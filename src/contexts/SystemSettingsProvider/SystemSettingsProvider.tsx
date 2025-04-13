import { SystemSettingsContext } from "./SystemSettingsContext";
import { SupabaseFunctionService } from "@/services/supabaseFunctionServices";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import Loader from "@/components/ui/loader";

const SystemSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { tenantId } = useTenant();
  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ["systemSettings", tenantId],
    queryFn: async () => {
      const response = await SupabaseFunctionService.get("system");

      return response.json();
    },
    enabled: !!tenantId,
  });

  return (
    <SystemSettingsContext.Provider value={systemSettings}>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <Loader size="large" />
        </div>
      ) : (
        children
      )}
    </SystemSettingsContext.Provider>
  );
};

export default SystemSettingsProvider;
