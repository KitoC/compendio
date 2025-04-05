import { useAuth } from "@/hooks/useAuth";
import { useAiAgents } from "@/contexts/AiAgents";
import EmailAgentCard from "./dashboard-items/EmailAgentCard";
const Dashboard = () => {
  const { user, profile } = useAuth();
  const { aiAgents } = useAiAgents();

  const emailAgent = aiAgents.find((agent) => agent.name === "email-agent");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            Hello {profile?.display_name}, let's see what needs attention today.
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emailAgent && <EmailAgentCard agent={emailAgent} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
