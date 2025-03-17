
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateFunctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFunctionCreated: (functionId: string) => void;
}

const CreateFunctionModal = ({ isOpen, onClose, onFunctionCreated }: CreateFunctionModalProps) => {
  const { tenantId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [functionData, setFunctionData] = useState({
    name: "",
    description: "",
    type: "form",
    parameters: {},
    enabled_for: {},
    schema: {},
    config: {},
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFunctionData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!tenantId) return;
    
    setIsSubmitting(true);
    try {
      // Create JSON structure for non-string fields
      const newFunction = {
        ...functionData,
        parameters: JSON.stringify({}),
        enabled_for: JSON.stringify([]),
        schema: JSON.stringify({}),
        config: JSON.stringify({}),
        tenant_id: tenantId,
      };

      const { data, error } = await supabase
        .from("ai_functions")
        .insert(newFunction)
        .select("id")
        .single();

      if (error) throw error;
      
      toast.success("Function created successfully");
      onFunctionCreated(data.id);
      onClose();
    } catch (error) {
      console.error("Error creating function:", error);
      toast.error("Failed to create function");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New AI Function</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={functionData.name}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="e.g. get_weather"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={functionData.description}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="Describe what this function does"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Input
              id="type"
              value={functionData.type}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="e.g. form, retrieval"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting || !functionData.name || !functionData.description}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFunctionModal;
