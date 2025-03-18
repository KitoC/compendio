
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
import { ArrowLeft, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/ui/sidebar/context";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { Appearance, Table2, Users2 } from "lucide-react";

interface SidebarItemOrGroup {
  label: string;
  url?: string;
  icon?: React.ReactNode;
  children?: SidebarItemOrGroup[];
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
  const { user, profile, signOut } = useAuth();
  const { aiAgents } = useAiAgents();
  const { toggleSidebar } = useSidebar();
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const location = useLocation();

  // Check if we're in settings route
  const isInSettingsRoute = location.pathname.includes(ROUTES.SETTINGS);

  // Define sidebar items for main navigation
  const sidebarItems = [
    {
      label: "Agents",
      children: aiAgents.map((agent) => ({
        label: agent.human_name || agent.name,
        url: ROUTES.CONVERSATIONS_DETAIL.replace(":id", agent.name),
      })),
    },
  ];

  // Define footer items for main navigation
  const footerItems = [
    {
      label: "Settings",
      url: ROUTES.SETTINGS_APPEARANCE,
      icon: <Settings />,
    },
  ];

  // Define settings sidebar items
  const settingsItems = [
    {
      label: "Settings",
      children: [
        {
          label: "Appearance",
          url: ROUTES.SETTINGS_APPEARANCE,
          icon: <Appearance className="h-4 w-4" />,
        },
        {
          label: "Agents",
          url: ROUTES.SETTINGS_AGENTS,
          icon: <Users2 className="h-4 w-4" />,
        },
        {
          label: "Custom Tables",
          url: ROUTES.SETTINGS_CUSTOM_TABLES,
          icon: <Table2 className="h-4 w-4" />,
        },
      ],
    },
  ];

  // Define settings footer items
  const settingsFooterItems = [
    {
      label: "Back to Main Menu",
      url: ROUTES.CONVERSATIONS,
      icon: <ArrowLeft />,
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
    document.addEventListener("show-settings-sidebar", handleShowSettingsSidebar);
    document.addEventListener("restore-original-sidebar", handleRestoreOriginalSidebar);

    return () => {
      document.removeEventListener("toggle-sidebar", handleToggleSidebar);
      document.removeEventListener("show-settings-sidebar", handleShowSettingsSidebar);
      document.removeEventListener("restore-original-sidebar", handleRestoreOriginalSidebar);
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

  // Select which items to show based on sidebar mode
  const itemsToShow = showSettingsSidebar ? settingsItems : sidebarItems;
  const footerItemsToShow = showSettingsSidebar ? settingsFooterItems : footerItems;

  return (
    <Sidebar
      collapsible="offcanvas"
      side="left"
      className="border-r border-border"
    >
      <SidebarHeader className="flex items-center flex-row">
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
