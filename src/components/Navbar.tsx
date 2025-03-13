
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed w-full z-50 top-0 left-0 px-6 py-4 bg-transparent">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-xl font-display font-bold tracking-tight">
            Messenger<span className="text-primary">Hub</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
          <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
          <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
          <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
        </div>
        
        <div className="flex items-center space-x-4">
          <a 
            href="#getstarted" 
            className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary shadow-sm hover:bg-primary/90 transition-colors"
          >
            Get Started
          </a>
          <button className="md:hidden block p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
