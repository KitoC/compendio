
import React, { useRef, useEffect, useState } from 'react';
import FeatureNode from './FeatureNode';

const Hero: React.FC = () => {
  const phoneRef = useRef<HTMLDivElement>(null);
  const [showNodes, setShowNodes] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNodes(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-hidden pt-16 flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50 to-white z-0" />
      
      <svg className="absolute w-full h-full top-0 left-0 opacity-30 z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(234,88,12,0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      <div className="w-full max-w-6xl px-6 py-24 flex flex-col items-center relative z-10">
        <div className="text-center mb-8 md:mb-10">
          <h3 className="text-lg md:text-xl font-medium text-primary">
            All-in-One Management Platform
          </h3>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mt-2">
            Your Complete <span className="text-gradient">Business Solution</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground">
            Easily manage tasks, quotes, scheduling and client communications all in one place. The smart platform built for busy professionals.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <a href="#demo" className="px-8 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors font-medium">
              Get a Demo
            </a>
            <a href="#signup" className="px-8 py-3 bg-white border border-gray-200 text-gray-800 rounded-full shadow-sm hover:shadow-md transition-all font-medium">
              Start 14-Day Free Trial
            </a>
          </div>
        </div>
        
        <div className="w-full mt-12 md:mt-20 flex justify-center relative">
          <div 
            ref={phoneRef} 
            className="device-frame w-[280px] h-[560px] z-10"
          >
            <div className="device-notch"></div>
            <div className="device-screen h-full w-full">
              {/* Generic App UI */}
              <div className="h-full flex flex-col">
                <div className="bg-primary p-4 text-white">
                  <div className="text-sm mb-1 opacity-80">My Tasks</div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="font-medium">Today's Schedule</div>
                  </div>
                </div>
                <div className="flex-1 p-3 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div 
                      key={index} 
                      className="p-3 mb-3 rounded-lg border border-gray-200 shadow-sm bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">
                          {["Project Presentation", "Client Meeting", "Team Collaboration", "Strategy Review"][index]}
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"][index]}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {["Conference Room", "Zoom Call", "Meeting Room 3", "Executive Office"][index]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Nodes */}
          {showNodes && (
            <>
              <FeatureNode 
                type="calendar" 
                delay={0.5} 
                position={{ top: '15%', left: '10%' }} 
                phoneRef={phoneRef} 
              />
              <FeatureNode 
                type="messaging" 
                delay={0.7} 
                position={{ top: '25%', right: '8%' }} 
                phoneRef={phoneRef} 
              />
              <FeatureNode 
                type="analytics" 
                delay={0.9} 
                position={{ top: '60%', left: '5%' }} 
                phoneRef={phoneRef} 
              />
              <FeatureNode 
                type="documents" 
                delay={1.1} 
                position={{ bottom: '20%', right: '7%' }} 
                phoneRef={phoneRef} 
              />
              <FeatureNode 
                type="notifications" 
                delay={1.3} 
                position={{ bottom: '10%', left: '20%' }} 
                phoneRef={phoneRef} 
              />
              <FeatureNode 
                type="settings" 
                delay={1.5} 
                position={{ top: '5%', right: '25%' }} 
                phoneRef={phoneRef} 
              />
            </>
          )}
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Hero;
