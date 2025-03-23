import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { LogOut, User, MessageSquare, Menu, X } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    tenantId,
    urlTenantAlias,
    hasTenantAccess,
    isTenantOwner,
    tenantData,
  } = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Helper function to get the dashboard link
  const getDashboardLink = () => {
    if (tenantData) {
      return ROUTES.APPLICATION.replace(":tenantId", tenantData.workspace);
    }

    if (!urlTenantAlias || !hasTenantAccess) return ROUTES.INDEX;

    return ROUTES.APPLICATION.replace(":tenantId", urlTenantAlias);
  };

  const dashboardLink = getDashboardLink();

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={ROUTES.INDEX} className="font-display font-bold text-xl">
              TradeStack
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            <Link to={ROUTES.INDEX} className="px-3 py-2 text-sm font-medium">
              Home
            </Link>
            {user && (
              <Link
                to={dashboardLink}
                className="px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
            )}
            {isTenantOwner && (
              <span className="px-3 py-2 text-sm font-medium text-green-600">
                Admin
              </span>
            )}
          </nav>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={dashboardLink} className="cursor-pointer">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to={ROUTES.AUTH}>Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white pb-4 px-6">
          <div className="space-y-1">
            <Link
              to={ROUTES.INDEX}
              className="block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {user && (
              <Link
                to={dashboardLink}
                className="block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {isTenantOwner && (
              <span className="block px-3 py-2 rounded-md text-base font-medium text-green-600">
                Admin
              </span>
            )}
            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 rounded-md text-base font-medium"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            ) : (
              <Link
                to={ROUTES.AUTH}
                className="block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
