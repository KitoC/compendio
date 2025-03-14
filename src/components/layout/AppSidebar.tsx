
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ROUTES, SidebarSection } from "@/lib/constants";

// Default sidebar configuration - this could be fetched from an API or context
const SIDEBAR_CONFIG: SidebarSection[] = [
  {
    title: "Communication",
    links: [
      {
        title: "Conversations",
        href: ROUTES.CONVERSATIONS,
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Management",
    links: [
      {
        title: "Users",
        href: "#users",
        icon: Users,
      },
      {
        title: "Settings",
        href: "#settings",
        icon: Settings,
      },
    ],
  },
];

const AppSidebar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  
  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 pl-2">
              <LayoutDashboard className="h-6 w-6" />
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          {SIDEBAR_CONFIG.map((section, index) => (
            <SidebarGroup key={index}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarMenu>
                {section.links.map((link) => {
                  const isActive = location.pathname === link.href;
                  const Icon = link.icon;
                  
                  return (
                    <SidebarMenuItem key={link.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={link.title}
                      >
                        <Link to={link.href}>
                          {Icon && <Icon className="h-4 w-4" />}
                          <span>{link.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}

          {/* Example of nested section with collapsible content */}
          <SidebarGroup>
            <SidebarGroupLabel>Advanced Features</SidebarGroupLabel>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full flex items-center justify-between px-2">
                  <span>Analytics</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#reports">
                      Reports
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#dashboard">
                      Dashboard
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="border-t">
          <div className="p-2">
            <div className="flex items-center gap-2 p-2">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{profile?.username?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {profile?.username || 'User'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Logout
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default AppSidebar;
