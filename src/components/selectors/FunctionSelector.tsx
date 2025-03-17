
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateFunctionModal from "../modals/CreateFunctionModal";
import { toast } from "sonner";

interface AIFunction {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface FunctionSelectorProps {
  agentId: string;
  selectedFunctions: AIFunction[];
  onFunctionsChange: (functions: AIFunction[]) => void;
}

const FunctionSelector = ({
  agentId,
  selectedFunctions,
  onFunctionsChange,
}: FunctionSelectorProps) => {
  const { tenantId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [functions, setFunctions] = useState<AIFunction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    
    const fetchFunctions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ai_functions")
          .select("id, name, description, type")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null);

        if (error) throw error;
        setFunctions(data || []);
      } catch (error) {
        console.error("Error fetching functions:", error);
        toast.error("Failed to load AI functions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunctions();
  }, [tenantId]);

  const handleSelectFunction = async (fnId: string) => {
    if (!tenantId) return;

    // Find the function in our list
    const selectedFn = functions.find((fn) => fn.id === fnId);
    if (!selectedFn) return;

    // Check if it's already selected
    if (selectedFunctions.some((fn) => fn.id === fnId)) return;

    // Add to selected functions
    const newSelectedFunctions = [...selectedFunctions, selectedFn];
    onFunctionsChange(newSelectedFunctions);

    // Save the association in the database
    try {
      const { error } = await supabase.from("agent_functions").insert({
        agent_id: agentId,
        function_id: fnId,
        tenant_id: tenantId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error associating function with agent:", error);
      toast.error("Failed to associate function with agent");
      // Revert the UI change if the database operation failed
      onFunctionsChange(selectedFunctions);
    }

    setOpen(false);
  };

  const handleRemoveFunction = async (fnId: string) => {
    if (!tenantId) return;

    // Remove from selected functions
    const newSelectedFunctions = selectedFunctions.filter((fn) => fn.id !== fnId);
    onFunctionsChange(newSelectedFunctions);

    // Remove the association from the database
    try {
      const { error } = await supabase
        .from("agent_functions")
        .delete()
        .eq("agent_id", agentId)
        .eq("function_id", fnId)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing function from agent:", error);
      toast.error("Failed to remove function from agent");
      // Revert the UI change if the database operation failed
      onFunctionsChange(selectedFunctions);
    }
  };

  const handleFunctionCreated = (newFunctionId: string) => {
    // Refresh the functions list
    if (!tenantId) return;
    
    const fetchNewFunction = async () => {
      try {
        const { data, error } = await supabase
          .from("ai_functions")
          .select("id, name, description, type")
          .eq("id", newFunctionId)
          .single();

        if (error) throw error;
        if (data) {
          setFunctions((prev) => [...prev, data]);
          // Automatically select the newly created function
          handleSelectFunction(data.id);
        }
      } catch (error) {
        console.error("Error fetching new function:", error);
      }
    };

    fetchNewFunction();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedFunctions.map((fn) => (
          <Badge key={fn.id} variant="secondary" className="flex items-center gap-1">
            {fn.name}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleRemoveFunction(fn.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Select functions"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search functions..." />
              <CommandEmpty>No functions found.</CommandEmpty>
              <CommandGroup>
                {functions
                  .filter((fn) => !selectedFunctions.some((selected) => selected.id === fn.id))
                  .map((fn) => (
                    <CommandItem
                      key={fn.id}
                      value={fn.id}
                      onSelect={handleSelectFunction}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedFunctions.some((selected) => selected.id === fn.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{fn.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {fn.description}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CreateFunctionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onFunctionCreated={handleFunctionCreated}
      />
    </div>
  );
};

export default FunctionSelector;
