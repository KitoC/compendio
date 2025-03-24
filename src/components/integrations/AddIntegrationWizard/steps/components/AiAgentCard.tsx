import { Card, CardContent } from "@/components/ui/card";
import { Check, BotOff, Bot } from "lucide-react";
import { AiAgent, ICredential } from "../../types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clsx } from "clsx";

const CredentialCard = ({ id }: { id: string }) => {
  const [agent, setAgent] = useState<AiAgent | null>(null);

  const getSelectedAgent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching agent:", error);
      }

      setAgent(data as AiAgent);
    } catch (e) {
      toast.error("Error fetching agent:", e);
    }
  }, [id]);

  useEffect(() => {
    getSelectedAgent();
  }, [id, getSelectedAgent]);

  if (!agent) return null;

  return (
    <Card
      className={clsx(
        "cursor-pointer hover:border-warning transition-colors border-warning bg-warning/5",
        {
          "border-success bg-success/5 hover:border-success": agent.enabled,
        }
      )}
    >
      {agent && (
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">
                {agent.human_name} ({agent.name})
              </p>
              <p className="text-sm text-muted-foreground">
                {agent.responsibility}
              </p>
            </div>

            {agent.enabled && <Bot className="h-5 w-5 text-success" />}
            {!agent.enabled && <BotOff className="h-5 w-5 text-warning" />}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CredentialCard;
