
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const RequestAccess = () => {
  const [workspace, setWorkspace] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspace.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Request access by creating a pending tenant request
      const { error } = await supabase
        .from('tenant_requests')
        .insert({
          workspace: workspace,
          user_id: user?.id,
          user_email: user?.email,
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success("Access request submitted successfully");
      navigate('/access-pending');
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
            Enter your workspace name to request tenant access
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace Name</Label>
              <Input 
                id="workspace" 
                placeholder="Enter workspace name" 
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                required
              />
            </div>
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
