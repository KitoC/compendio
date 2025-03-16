
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare } from "lucide-react";
import { ROUTES } from "@/lib/constants";

// This value will change with each build
const BUILD_TIMESTAMP = new Date().toISOString();

const Index: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <main>
        <Hero />

        {/* Call to Action Section for Conversations */}
        {user && (
          <section className="py-16 bg-primary/5">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <MessageSquare className="mx-auto h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-4">
                  Start Collaborating Now
                </h2>
                <p className="mb-6 text-muted-foreground max-w-xl mx-auto">
                  Access your conversations and collaborate with your team in
                  real-time.
                </p>
                <Button asChild size="lg">
                  <Link to={ROUTES.CONVERSATIONS}>Go to My Conversations</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Features section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Everything You Need to Run Your Trade Business
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                All the tools you need to manage jobs, quotes, scheduling and
                client relationships in one easy platform.
              </p>
            </div>

            {/* Build indicator - will show when the page was last built */}
            <div className="text-center mb-8 p-2 bg-gray-100 rounded-md">
              <p className="text-xs text-gray-500">
                Latest build: {BUILD_TIMESTAMP}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Job Management",
                  description:
                    "Schedule, track and manage all your jobs in one place. Never miss an appointment again.",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Quote & Invoice Builder",
                  description:
                    "Create professional quotes and invoices in seconds. Get paid faster and track all financials.",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Team Communication",
                  description:
                    "Message clients and team members, send updates, and get approvals all within the app.",
                  icon: <MessageSquare className="h-10 w-10 text-primary" />,
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
                >
                  <div className="mb-4 p-3 bg-primary/5 rounded-full">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">
              Ready to level up your trade business?
            </h2>
            {user ? (
              <Button
                asChild
                size="lg"
                className="px-8 py-4 rounded-full shadow-lg font-medium text-lg"
              >
                <Link to={ROUTES.CONVERSATIONS}>Access Conversations</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="px-8 py-4 rounded-full shadow-lg font-medium text-lg"
              >
                <Link to={ROUTES.AUTH}>Start Your Free Trial</Link>
              </Button>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
