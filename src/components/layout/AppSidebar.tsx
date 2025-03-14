
import { useState } from "react";
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
  SidebarFooter
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Message, MessageSquare, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  
  const handleSignOut = async () => {
    await signOut();
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

  return (
    <Sidebar 
      defaultState="expanded" 
      collapsible
      side="left"
      onStateChange={(state) => setCollapsed(state === "collapsed")}
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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Link to={ROUTES.CONVERSATIONS}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location.pathname === ROUTES.CONVERSATIONS ? 'bg-accent text-accent-foreground' : ''}`}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Conversations
                </Button>
              </Link>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
