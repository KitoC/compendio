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
import {
  ArrowLeft,
  LogOut,
  Settings,
  Users2,
  Table2,
  Palette,
  Bot,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/ui/sidebar/context";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { useCustomTables } from "@/contexts/CustomTables/useCustomTables";
import { settingsItems } from "@/lib/constants";
import { useTenant } from "@/contexts/TenantContext";
import TenantSwitcher from "./TenantSwitcher";
import { useNotifications } from "@/contexts/NotificationProvider";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarItemOrGroup {
  label: string;
  url?: string;
  icon?: React.ReactNode;
  children?: SidebarItemOrGroup[];
  notificationCount?: number;
  onClick?: () => void;
}

const SidebarItem = (item: SidebarItemOrGroup) => {
  const { urlTenantAlias } = useTenant();
  const isMobile = useIsMobile();

  return (
    <SidebarMenuItem key={item.label}>
      <NavLink
        to={item.url?.replace(":tenantId", urlTenantAlias)}
        end
        className={({ isActive, isPending }) => {
          return clsx(
            "pr-2 pl-3 w-full flex items-center gap-2 min-h-fit rounded hover:grey-200 dark:hover:bg-gray-700",
            isActive && "bg-muted",
            isMobile ? "py-3" : "py-1"
          );
        }}
        onClick={item.onClick}
      >
        {item.icon && (
          <span className={clsx(isMobile ? "text-lg" : "")}>{item.icon}</span>
        )}
        <span className={clsx(isMobile ? "text-base" : "")}>{item.label}</span>
        {!!item.notificationCount && (
          <Badge variant="warning" className="ml-auto">
            {item.notificationCount}
          </Badge>
        )}
      </NavLink>
    </SidebarMenuItem>
  );
};

const AppSidebar = () => {
  const { user, profile, signOut } = useAuth();
  const { aiAgents } = useAiAgents();
  const { tables } = useCustomTables();
  const { toggleSidebar } = useSidebar();
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const location = useLocation();
  const { emailCount } = useNotifications();
  const isMobile = useIsMobile();

  // Check if we're in settings route
  const isInSettingsRoute = location.pathname.includes(ROUTES.SETTINGS);

  const onNavItemClick = () => {
    if (isMobile) {
      document.dispatchEvent(new CustomEvent("toggle-sidebar"));
    }
  };

  // Define sidebar items for main navigation
  const sidebarItems = [
    {
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
      url: ROUTES.DASHBOARD,
      onClick: onNavItemClick,
    },
    {
      icon: <Bot className="h-4 w-4" />,
      label: "Assistants",
      children: aiAgents.map((agent) => ({
        label: agent.human_name || agent.name,
        url: ROUTES.AGENT_CHAT.replace(":id", agent.name),
        notificationCount: agent.name === "emaemail-assistant" ? emailCount : 0,
        onClick: onNavItemClick,
      })),
    },
    {
      icon: <Table2 className="h-4 w-4" />,
      label: "Resources",
      hidden: tables.length === 0,
      children: tables.map((table) => ({
        label: table.name,
        url: ROUTES.CUSTOM_TABLE_DATA.replace(":id", table.id),
        onClick: onNavItemClick,
      })),
    },
  ];

  // Define footer items for main navigation
  const footerItems = [
    {
      label: "Settings",
      url: ROUTES.SETTINGS_APPEARANCE,
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  // Define settings footer items
  const settingsFooterItems = [
    {
      label: "Back to Main Menu",
      url: ROUTES.DASHBOARD,
      icon: <ArrowLeft className="h-4 w-4" />,
      onClick: (e) => {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("restore-original-sidebar"));
        setShowSettingsSidebar(false);
      },
    },
  ];

  // Listen for custom events to toggle sidebar from the header
  useEffect(() => {
    const handleToggleSidebar = () => {
      toggleSidebar();
    };

    const handleShowSettingsSidebar = () => {
      setShowSettingsSidebar(true);
    };

    const handleRestoreOriginalSidebar = () => {
      setShowSettingsSidebar(false);
    };

    document.addEventListener("toggle-sidebar", handleToggleSidebar);
    document.addEventListener(
      "show-settings-sidebar",
      handleShowSettingsSidebar
    );
    document.addEventListener(
      "restore-original-sidebar",
      handleRestoreOriginalSidebar
    );

    return () => {
      document.removeEventListener("toggle-sidebar", handleToggleSidebar);
      document.removeEventListener(
        "show-settings-sidebar",
        handleShowSettingsSidebar
      );
      document.removeEventListener(
        "restore-original-sidebar",
        handleRestoreOriginalSidebar
      );
    };
  }, [toggleSidebar]);

  // Auto-switch sidebar mode based on current route if not explicitly set
  useEffect(() => {
    if (isInSettingsRoute && !showSettingsSidebar) {
      setShowSettingsSidebar(true);
    }
  }, [isInSettingsRoute, showSettingsSidebar]);

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

  // Render sidebar menu items recursively
  const renderSidebarItems = (items) => {
    return items.map((item) => {
      if (item.url) {
        return <SidebarItem key={item.label} {...item} />;
      }
      return null;
    });
  };

  const renderItems = (items) => {
    return items.map((section, index) => {
      if (section.hidden) return null;

      return (
        <div key={section.label}>
          {index > 0 && <SidebarSeparator />}

          {section.children?.length ? (
            <SidebarGroup>
              {section.children?.length && (
                <div className="flex items-center px-2 gap-2">
                  {section.icon && section.icon}
                  <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                </div>
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
      );
    });
  };

  // Select which items to show based on sidebar mode
  const itemsToShow = showSettingsSidebar
    ? settingsItems.map((item) => ({
        ...item,
        children: item.children.map((child) => ({
          ...child,
          onClick: onNavItemClick,
        })),
      }))
    : sidebarItems;
  const footerItemsToShow = showSettingsSidebar
    ? settingsFooterItems
    : footerItems;

  return (
    <Sidebar
      collapsible="offcanvas"
      side="left"
      className="border-r border-border bg-sidebar"
    >
      <SidebarHeader className="flex flex-col space-y-2 p-2 pt-safe-top">
        <div className="mt-1" />
        <TenantSwitcher />
        <div className="flex items-center flex-row p-2">
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
        </div>
      </SidebarHeader>

      <SidebarContent>{renderItems(itemsToShow)}</SidebarContent>

      <SidebarFooter>
        {renderItems(footerItemsToShow)}
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-100"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
