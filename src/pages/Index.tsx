
import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <main>
        <Hero />
        
        {/* Features section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything You Need to Run Your Business</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                All the tools you need to manage tasks, projects, scheduling and client relationships in one easy platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Task Management",
                  description: "Schedule, track and manage all your tasks in one place. Never miss an appointment again.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )
                },
                {
                  title: "Quote & Invoice Builder",
                  description: "Create professional quotes and invoices in seconds. Get paid faster and track all financials.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  title: "Client Communication",
                  description: "Message clients, send updates, and get approvals all within the app. Keep all communications in one place.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )
                }
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">Ready to level up your business?</h2>
            <a 
              href="#getstarted" 
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors font-medium text-lg"
            >
              Start Your Free Trial
            </a>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required. 14-day free trial.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
