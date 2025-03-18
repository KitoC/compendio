
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarSeparator,
  SidebarFooter,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Database, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/ui/sidebar/context";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { useUserSettings } from "@/contexts/UserSettingsProvider";
import { supabase } from "@/integrations/supabase/client";

interface SidebarItemOrGroup {
  label: string;
  url?: string;
  icon?: React.ReactNode;
  children?: SidebarItemOrGroup[];
}

interface CustomTable {
  id: string;
  name: string;
  display_name: string;
  icon?: string;
}

const SidebarItem = (item: SidebarItemOrGroup) => {
  return (
    <SidebarMenuItem key={item.label}>
      <NavLink
        to={item.url}
        className={({ isActive, isPending }) => {
          return clsx(
            "pr-2 pl-3 w-full flex items-center gap-2 min-h-fit py-1 rounded",
            isActive && "bg-muted"
          );
        }}
      >
        {item.icon && item.icon}
        <span>{item.label}</span>
      </NavLink>
    </SidebarMenuItem>
  );
};

const AppSidebar = () => {
  const { user, profile, signOut, tenantId } = useAuth();
  const { aiAgents } = useAiAgents();
  const { toggleSidebar } = useSidebar();
  const { sidebarConfig } = useUserSettings();
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);
  const [isSettingsActive, setIsSettingsActive] = useState(false);
  const location = useLocation();

  // Fetch custom tables
  useEffect(() => {
    if (!sidebarConfig.showCustomTables || !user || !tenantId) return;

    const fetchCustomTables = async () => {
      const { data, error } = await supabase
        .from("custom_table_definitions")
        .select("id, name, display_name, icon")
        .eq("tenant_id", tenantId);

      if (error) {
        console.error("Error fetching custom tables:", error);
        return;
      }

      setCustomTables(data || []);
    };

    fetchCustomTables();
  }, [user, tenantId, sidebarConfig.showCustomTables]);

  // Check if settings page is active
  useEffect(() => {
    setIsSettingsActive(location.pathname.startsWith(ROUTES.SETTINGS));
  }, [location.pathname]);

  // Listen for custom event to toggle sidebar from the header
  useEffect(() => {
    const handleToggleSidebar = () => {
      toggleSidebar();
    };

    document.addEventListener("toggle-sidebar", handleToggleSidebar);

    return () => {
      document.removeEventListener("toggle-sidebar", handleToggleSidebar);
    };
  }, [toggleSidebar]);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button behavior
    try {
      await signOut();
    } catch (error) {
      console.error("Error in handleSignOut:", error);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Main sidebar items
  const mainSidebarItems = [
    {
      label: "Agents",
      children: aiAgents.map((agent) => ({
        label: agent.human_name || agent.name,
        url: ROUTES.CONVERSATIONS_DETAIL.replace(":id", agent.name),
      })),
    },
  ];

  // Custom tables sidebar items
  const tablesSidebarItems = sidebarConfig.showCustomTables && customTables.length > 0
    ? [
        {
          label: "Tables",
          children: customTables.map((table) => ({
            label: table.display_name,
            url: `/tables/${table.name}`,
            icon: <Database className="h-4 w-4" />,
          })),
        },
      ]
    : [];

  // Settings sidebar items
  const settingsSidebarItems = [
    {
      label: "Appearance",
      url: ROUTES.SETTINGS_APPEARANCE,
    },
    {
      label: "Agents",
      url: ROUTES.SETTINGS_AGENTS,
    },
    {
      label: "Custom Tables",
      url: ROUTES.SETTINGS_CUSTOM_TABLES,
    },
  ];

  // Render sidebar menu items recursively
  const renderSidebarItems = (items) => {
    return items.map((item) => {
      if (item.children?.length) {
        return null;
      }
      return <SidebarItem key={item.label} {...item} />;
    });
  };

  const renderItems = (items) => {
    return items.map((section, index) => (
      <div key={section.label}>
        {index > 0 && <SidebarSeparator />}

        {section.children?.length ? (
          <SidebarGroup>
            {section.children?.length && (
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu>
                {section.children && renderSidebarItems(section.children)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarItem key={section.label} {...section} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </div>
    ));
  };

  const handleBackToMain = () => {
    setIsSettingsActive(false);
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      side="left"
      className="border-r border-border"
    >
      <SidebarHeader className="flex items-center flex-row">
        {isSettingsActive ? (
          <div className="flex items-center w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={handleBackToMain}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Settings</span>
          </div>
        ) : (
          <>
            <Avatar className="w-8 h-8 mr-2">
              <AvatarImage
                src={profile?.avatar_url || undefined}
                alt={profile?.username || "User"}
              />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium">
                {profile?.username || user?.email}
              </span>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        {isSettingsActive ? (
          renderItems(settingsSidebarItems.map(item => ({ ...item })))
        ) : (
          <>
            {renderItems(mainSidebarItems)}
            {sidebarConfig.showCustomTables && customTables.length > 0 && (
              renderItems(tablesSidebarItems)
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {!isSettingsActive && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavLink
                      to={ROUTES.SETTINGS}
                      className={({ isActive }) => {
                        return clsx(
                          "pr-2 pl-3 w-full flex items-center gap-2 min-h-fit py-1 rounded",
                          isActive && "bg-muted"
                        );
                      }}
                      onClick={() => setIsSettingsActive(true)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </NavLink>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
