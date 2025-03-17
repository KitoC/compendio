
import { useEffect, useState } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import AuthRequired from "@/components/AuthRequired";
import PageLoading from "@/components/PageLoading";

const Settings = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { user, isLoading, hasTenant } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  // Fetch user role from Supabase
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !hasTenant) return;

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role_type")
          .eq("user_id", user.id)
          .eq("tenant_id", user.tenant_id)
          .single();

        if (error) throw error;
        setUserRole(data?.role_type || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user, hasTenant]);

  // Define tabs configuration
  const tabs = [
    {
      id: "appearance",
      label: "Appearance",
      url: `${ROUTES.SETTINGS}/appearance`,
      roles: ["admin", "member", "guest", "super-admin", "tenant-owner"],
    },
    {
      id: "agents",
      label: "Agents",
      url: `${ROUTES.SETTINGS}/agents`,
      roles: ["super-admin", "tenant-owner"],
    },
  ];

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(
    (tab) => userRole && tab.roles.includes(userRole)
  );

  // Navigate to the first tab if none is selected
  useEffect(() => {
    if (!isLoading && !isRoleLoading && visibleTabs.length > 0) {
      if (!tab || !visibleTabs.some((t) => t.id === tab)) {
        navigate(visibleTabs[0].url, { replace: true });
      }
    }
  }, [tab, visibleTabs, navigate, isLoading, isRoleLoading]);

  if (isLoading || isRoleLoading) {
    return <PageLoading />;
  }

  return (
    <AuthRequired>
      <div className="container mx-auto py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <Tabs value={tab} className="w-full">
              <TabsList className="w-full flex justify-start overflow-x-auto">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    onClick={() => navigate(tab.url)}
                    className="flex-1"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          <div className="p-6">
            <Outlet />
          </div>
        </Card>
      </div>
    </AuthRequired>
  );
};

export default Settings;
