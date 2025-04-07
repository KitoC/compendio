import { useState, useEffect, useCallback } from "react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FormBuilder from "@/components/form-builder";
import { newAgentFormConfig } from "@/forms/agents";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Plus } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import type { AiAgent } from "../types";
import { Database } from "@/integrations/supabase/types";
import { StepProps } from "../types";
import AiAgentCard from "./components/AiAgentCard";

const AddAiAgent = ({
  resetAndClose,
  nextStep,
  wizardState,
  onStepDataCapture,
  prevStep,
}: StepProps) => {
  const { tenantId } = useTenant();
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agents, setAgents] = useState<AiAgent[]>([]);

  const onAgentSelection = useCallback(
    (agent_id: string) => {
      onStepDataCapture({ agent_id });
    },
    [onStepDataCapture]
  );

  const handleCreateAgent = async (values: Record<string, unknown>) => {
    if (!tenantId) return;

    try {
      setIsSubmitting(true);

      // Convert enabled boolean if it exists
      const agentData = {
        ...values,
        enabled: values.enabled === undefined ? true : Boolean(values.enabled),
        tenant_id: tenantId,
      };

      const { data, error } = await supabase
        .from("ai_agents")
        .insert([
          agentData as Database["public"]["Tables"]["ai_agents"]["Insert"],
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setAgents([...agents, data[0]]);
        onAgentSelection(data[0].id);
        toast.success("Agent created successfully");

        // Refresh agents list
        await fetchAgents();

        // Exit creation mode and continue wizard
        setIsCreatingAgent(false);
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAgents = useCallback(async () => {
    if (!tenantId) return;

    if (isLoadingAgents) return;

    try {
      setIsLoadingAgents(true);

      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, name, human_name, avatar_url")
        .eq("tenant_id", tenantId)
        .eq("enabled", true);

      if (error) throw error;

      setAgents(data || []);
      if (!wizardState?.agent_id) {
        onAgentSelection(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoadingAgents(false);
    }
  }, [tenantId, isLoadingAgents, wizardState?.agent_id, onAgentSelection]);

  // Only fetch agents when the dialog is opened and not in agent creation mode
  useEffect(() => {
    if (!agents.length) {
      fetchAgents();
    }
  }, [agents, fetchAgents]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Select Agent</DialogTitle>
        <DialogDescription>
          Choose which AI agent will use this integration
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        {isCreatingAgent ? (
          <div className="space-y-4">
            <FormBuilder
              config={newAgentFormConfig}
              onSubmit={handleCreateAgent}
              isSubmitting={isSubmitting}
            />
            <Button
              variant="outline"
              onClick={() => setIsCreatingAgent(false)}
              className="w-full mt-2"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            {isLoadingAgents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  No agents found. Create an agent first.
                </p>
                <Button onClick={() => setIsCreatingAgent(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <AiAgentCard id={wizardState?.agent_id} />
                <Select
                  value={wizardState?.agent_id}
                  onValueChange={onAgentSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.human_name || agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingAgent(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Agent
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {!isCreatingAgent && (
        <DialogFooter>
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={!wizardState?.agent_id || isLoadingAgents}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      )}
    </>
  );
};

export default AddAiAgent;
