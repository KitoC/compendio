
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { ROUTES } from '@/lib/constants';

const RequestAccess = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { urlTenantAlias, tenantData, tenantId } = useTenant();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId || !user) {
      toast.error("Missing tenant or user information");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create a tenant request for the specific tenant ID
      const { data, error } = await supabase
        .from('tenant_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          workspace: urlTenantAlias,
          status: 'pending'
        });

      if (error) {
        console.error('Tenant request error:', error);
        throw error;
      }
      
      toast.success("Access request submitted successfully");
      
      // Navigate to the pending page for this tenant
      const pendingUrl = ROUTES.ACCESS_PENDING.replace(':tenantId', urlTenantAlias);
      navigate(pendingUrl);
      
    } catch (error: any) {
      console.error('Error requesting access:', error);
      toast.error(error.message || "Failed to submit access request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Request Access</CardTitle>
          <CardDescription className="text-center">
            Request access to {tenantData?.name || urlTenantAlias} workspace
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <p className="text-center">
              You don't currently have access to this workspace.
              Click below to request access from the workspace administrator.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Request Access"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RequestAccess;
