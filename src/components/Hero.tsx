
import React, { useRef, useEffect } from 'react';
import FeatureNode from './FeatureNode';

const Hero: React.FC = () => {
  const phoneRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen w-full overflow-hidden pt-16 flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white z-0" />
      
      <svg className="absolute w-full h-full top-0 left-0 opacity-30 z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,150,0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      <div className="w-full max-w-6xl px-6 py-24 flex flex-col items-center relative z-10 animate-fade-in">
        <div className="text-center mb-8 md:mb-10">
          <h3 className="text-lg md:text-xl font-medium text-primary animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
            All-in-one Communication Platform
          </h3>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mt-2 animate-fade-in opacity-0" style={{ animationDelay: '0.3s' }}>
            Your Business <span className="text-gradient">Messaging Hub</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground animate-fade-in opacity-0" style={{ animationDelay: '0.5s' }}>
            Seamlessly connect with customers through multiple channels while managing all your business communications in one place.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in opacity-0" style={{ animationDelay: '0.7s' }}>
            <a href="#demo" className="px-8 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors font-medium">
              Watch Demo
            </a>
            <a href="#signup" className="px-8 py-3 bg-white border border-gray-200 text-gray-800 rounded-full shadow-sm hover:shadow-md transition-all font-medium">
              Start Free Trial
            </a>
          </div>
        </div>
        
        <div className="w-full mt-12 md:mt-20 flex justify-center relative animate-fade-in opacity-0" style={{ animationDelay: '0.9s' }}>
          <div 
            ref={phoneRef} 
            className="device-frame animate-float w-[280px] h-[560px] z-10"
          >
            <div className="device-notch"></div>
            <div className="device-screen h-full w-full">
              {/* Messaging App UI */}
              <div className="h-full flex flex-col">
                <div className="bg-primary p-4 text-white">
                  <div className="text-sm mb-1 opacity-80">Messages</div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="font-medium">Business Messages</div>
                  </div>
                </div>
                <div className="flex-1 p-3 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div 
                      key={index} 
                      className="flex mb-3 items-start animate-fade-in opacity-0" 
                      style={{ animationDelay: `${1.2 + index * 0.1}s` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                      <div className="ml-2 bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                        <div className="w-full h-2 bg-gray-300 rounded-full mb-2"></div>
                        <div className="w-2/3 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div 
                      key={index} 
                      className="flex mb-3 items-start justify-end animate-fade-in opacity-0" 
                      style={{ animationDelay: `${1.7 + index * 0.1}s` }}
                    >
                      <div className="mr-2 bg-primary/20 rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                        <div className="w-full h-2 bg-primary/30 rounded-full mb-2"></div>
                        <div className="w-3/4 h-2 bg-primary/30 rounded-full"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <div className="flex items-center bg-gray-100 rounded-full p-2">
                    <div className="w-full h-6 bg-white rounded-full"></div>
                    <div className="ml-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Nodes */}
          <FeatureNode 
            type="crm" 
            delay={2.5} 
            position={{ top: '15%', left: '10%' }} 
            phoneRef={phoneRef} 
          />
          <FeatureNode 
            type="messaging" 
            delay={2.7} 
            position={{ top: '25%', right: '8%' }} 
            phoneRef={phoneRef} 
          />
          <FeatureNode 
            type="quotes" 
            delay={2.9} 
            position={{ top: '60%', left: '5%' }} 
            phoneRef={phoneRef} 
          />
          <FeatureNode 
            type="invoices" 
            delay={3.1} 
            position={{ bottom: '20%', right: '7%' }} 
            phoneRef={phoneRef} 
          />
          <FeatureNode 
            type="calendar" 
            delay={3.3} 
            position={{ bottom: '10%', left: '20%' }} 
            phoneRef={phoneRef} 
          />
          <FeatureNode 
            type="email" 
            delay={3.5} 
            position={{ top: '5%', right: '25%' }} 
            phoneRef={phoneRef} 
          />
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
