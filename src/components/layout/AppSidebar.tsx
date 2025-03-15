
import { Link, useLocation } from "react-router-dom";
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
  SidebarTrigger,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, sidebarItems } from "@/lib/constants";
import { useSidebar } from "@/components/ui/sidebar/context";
import { useEffect } from "react";

const AppSidebar = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  
  // Listen for custom event to toggle sidebar from the header
  useEffect(() => {
    const handleToggleSidebar = () => {
      toggleSidebar();
    };
    
    document.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    return () => {
      document.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, [toggleSidebar]);
  
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button behavior
    console.log("Sign out button clicked");
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
        return (
          <SidebarMenuItem key={item.label}>
            <Link to={item.url}>
              <SidebarMenuButton 
                isActive={location.pathname === item.url}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      }
      return null;
    });
  };

  return (
    <Sidebar 
      collapsible="offcanvas"
      side="left"
      className="border-r border-border"
    >
      <SidebarHeader className="flex items-center">
        <Avatar className="w-8 h-8 mr-2">
          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-left">
          <span className="text-sm font-medium">{profile?.username || user?.email}</span>
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {sidebarItems.map((section, index) => (
          <div key={section.label}>
            {index > 0 && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.children && renderSidebarItems(section.children)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
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
