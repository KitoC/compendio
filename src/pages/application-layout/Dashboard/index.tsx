import { useAuth } from "@/hooks/useAuth";
import { useAiAgents } from "@/contexts/AiAgents";
import EmailAgentCard from "./dashboard-items/EmailAgentCard";
const Dashboard = () => {
  const { user, profile } = useAuth();
  const { aiAgents } = useAiAgents();

  const emailAgent = aiAgents.find((agent) => agent.name === "email-assistant");

  return (
    <div className="min-h-screen">
      <div className="px-4 mx-auto py-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            Hello {profile?.display_name}, let's see what needs attention today.
          </h1>
        </div>

        <div className="grid grid-cols-auto-fit gap-6">
          {emailAgent && <EmailAgentCard agent={emailAgent} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
