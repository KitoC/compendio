import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabRoute {
  id: string;
  label: string;
  icon?: LucideIcon;
  path: string;
}

interface TabRouterProps {
  routes: TabRoute[];
  className?: string;
}

export const TabRouter = ({ routes, className }: TabRouterProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const rootTab = routes.find((route) => route.path === "")?.id;

  // Find the current tab based on the current path
  const currentTab =
    routes
      .filter((route) => route.path !== "")
      .find((route) => {
        // For relative paths, check if the current pathname ends with the route path
        return location.pathname.endsWith(route.path);
      })?.id || rootTab;

  return (
    <div className={cn("flex flex-col gap-4 h-full", className)}>
      <Tabs className="w-full" value={currentTab}>
        <div className="flex flex-row justify-between">
          <TabsList className="justify-start">
            {routes.map((route) => (
              <TabsTrigger
                onClick={() => {
                  navigate(route.path);
                }}
                key={route.id}
                value={route.id}
                className="flex items-center gap-2"
              >
                {route.icon && <route.icon className="h-4 w-4" />}
                {route.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div id="tabs-actions"></div>
        </div>
      </Tabs>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};
