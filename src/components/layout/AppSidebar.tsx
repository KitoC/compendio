import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { kebabCase } from "lodash";
import {
  ArrowLeft,
  LogOut,
  Settings,
  Table2,
  Bot,
  LayoutDashboard,
  ListPlus,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/ui/sidebar/context";
import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { useCustomTables } from "@/contexts/CustomTables/useCustomTables";
import { settingsItems } from "@/lib/constants";
import { useTenant } from "@/contexts/TenantContext";
import TenantSwitcher from "./TenantSwitcher";
import { useNotifications } from "@/contexts/NotificationProvider";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { IAiAgent } from "@/types/aiAgents";
import { useDataNavigationItemsQuery } from "@/hooks/DataNavigationItems";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { IconPicker } from "../ui/icon-picker";
import { useDataNavigationItemMutation } from "@/hooks/DataNavigationItems/useDataNavigationItemMutation";
import { paths } from "@/utils/pathHelpers";
interface SidebarItemOrGroup {
  label: string;
  url?: string;
  icon?: React.ReactNode;
  children?: SidebarItemOrGroup[];
  notificationCount?: number;
  onClick?: () => void;
}

const NavItemAdder = () => {
  const isMobile = useIsMobile();
  const { tenantId, urlTenantAlias } = useTenant();
  const [showNavItemAdder, setShowNavItemAdder] = useState(false);
  const [navItemName, setNavItemName] = useState("");
  const [navItemIcon, setNavItemIcon] = useState("");
  const path = kebabCase(navItemName);
  const navigate = useNavigate();

  const { mutate: createDataNavigationItem, isPending } =
    useDataNavigationItemMutation();

  const onAddNavItem = useCallback(async () => {
    await createDataNavigationItem({
      name: navItemName,
      icon: navItemIcon as IconName,
      path,
      description: "",
      tenant_id: tenantId,
    });

    navigate(paths.getDataNavigationPath(path, urlTenantAlias));
  }, [
    createDataNavigationItem,
    navItemName,
    navItemIcon,
    path,
    tenantId,
    urlTenantAlias,
    navigate,
  ]);

  return (
    <SidebarGroup className="mt-0 pt-0">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem key="nav-item-adder">
            <DropdownMenu
              open={showNavItemAdder}
              onOpenChange={setShowNavItemAdder}
            >
              <DropdownMenuTrigger asChild>
                <div
                  className={clsx(
                    "pr-2 pl-3 w-full flex items-center gap-2 min-h-fit rounded hover:bg-slate-300 dark:hover:bg-gray-700",
                    isMobile ? "py-3" : "py-1",
                    showNavItemAdder && "bg-muted"
                  )}
                >
                  <ListPlus className="h-4 w-4" />
                  Add module
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right">
                <div className="p-2 flex">
                  <Input
                    autoFocus
                    placeholder="New module name"
                    value={navItemName}
                    onChange={(e) => setNavItemName(e.target.value)}
                  />
                  <IconPicker value={navItemIcon} onChange={setNavItemIcon} />
                  <Button
                    disabled={isPending || !navItemName || !navItemIcon}
                    variant="outline"
                    onClick={onAddNavItem}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const SidebarItem = (item: SidebarItemOrGroup) => {
  const { urlTenantAlias } = useTenant();
  const isMobile = useIsMobile();
  const location = useLocation();
  const to = item.url?.replace(":tenantId", urlTenantAlias);
  const isDashboard =
    to === ROUTES.DASHBOARD.replace(":tenantId", urlTenantAlias);

  return (
    <SidebarMenuItem key={item.label}>
      <NavLink
        to={to}
        end
        className={({ isActive, isPending }) => {
          const isRelativeActive =
            !isDashboard && location.pathname?.includes(to);

          return clsx(
            "pr-2 pl-3 w-full flex items-center gap-2 min-h-fit rounded hover:bg-slate-300 dark:hover:bg-gray-700",
            (isActive || isRelativeActive) && "bg-muted",
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
  const { tables = [] } = useCustomTables();
  const { data: dataNavigationItems } = useDataNavigationItemsQuery();
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

  const getNotificationCount = (agent: IAiAgent) => {
    if (agent.name === "email-assistant") {
      return emailCount;
    }
    return 0;
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
        notificationCount: getNotificationCount(agent),
        onClick: onNavItemClick,
      })),
    },
    {
      label: "Modules",
      children: [
        ...dataNavigationItems.map((navItem) => ({
          label: navItem.name,
          url: ROUTES.DATA_NAVIGATION.replace(
            ":dataNavigationPath",
            navItem.path
          ),
          onClick: onNavItemClick,
          icon: navItem.icon ? (
            <DynamicIcon name={navItem.icon} className="h-4 w-4" />
          ) : (
            <Table2 className="h-4 w-4" />
          ),
        })),
      ],
    },
  ];

  // Define footer items for main navigation
  const footerItems = [
    {
      label: "Settings",
      url: ROUTES.SETTINGS_APPEARANCE,
      icon: <Settings className="h-4 w-4" />,
      onClick: (e) => {
        e.preventDefault();
        setShowSettingsSidebar(true);
      },
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
              {section.children?.length && section.label && (
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

      <SidebarContent>
        {renderItems(itemsToShow)}
        <NavItemAdder />
      </SidebarContent>

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
